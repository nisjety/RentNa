import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalMutation, mutation, query } from './_generated/server';

const AUTO_OFFLINE_AFTER_MS = 30 * 60 * 1000; // 30 minutes

const VALID_STATUSES = [
  'available',     // Ledig nå
  'en_route',      // På vei (requires etaMinutes + currentBookingId)
  'working',       // Jobber nå (requires currentBookingId)
  'available_in',  // Ledig om X timer (requires availableInHours)
  'offline',       // Offline
] as const;

async function getSlugForUser(ctx: any): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const profile = await ctx.db
    .query('cleanerProfiles')
    .withIndex('by_user', (q: any) => q.eq('userId', identity.subject))
    .first();
  return profile?.cleanerSlug ?? null;
}

/** Get the current live status for the signed-in cleaner. */
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const slug = await getSlugForUser(ctx);
    if (!slug) return null;
    return ctx.db
      .query('cleanerStatus')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .first();
  },
});

/** Get live status for a specific cleaner slug (used by customer screens). */
export const getBySlug = query({
  args: { cleanerSlug: v.string() },
  handler: async (ctx, { cleanerSlug }) => {
    const status = await ctx.db
      .query('cleanerStatus')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', cleanerSlug))
      .first();
    if (!status) return null;
    // Treat stale heartbeats as offline (in case cron hasn't run yet)
    if (Date.now() - status.lastSeenAt > AUTO_OFFLINE_AFTER_MS) {
      return { ...status, status: 'offline' };
    }
    return status;
  },
});

/** Bulk lookup for the cleaner list — returns a map slug → status doc. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('cleanerStatus').collect();
    const now = Date.now();
    return all.map((s) =>
      now - s.lastSeenAt > AUTO_OFFLINE_AFTER_MS
        ? { ...s, status: 'offline' }
        : s,
    );
  },
});

/** Cleaner-side: set live status. */
export const setStatus = mutation({
  args: {
    status: v.string(),
    etaMinutes: v.optional(v.number()),
    currentBookingId: v.optional(v.id('bookings')),
    availableInHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const slug = await getSlugForUser(ctx);
    // Silently no-op when Convex can't see the identity (e.g. Clerk JWT
    // template "convex" not yet configured). The customer/cleaner-pro
    // shells surface the AuthSetupBanner — no need to red-screen here.
    if (!slug) return;
    if (!VALID_STATUSES.includes(args.status as any)) {
      throw new Error('Ugyldig status');
    }
    if (args.status === 'en_route') {
      if (args.etaMinutes == null || args.currentBookingId == null) {
        throw new Error('På vei krever ETA og booking');
      }
    }
    if (args.status === 'working' && args.currentBookingId == null) {
      throw new Error('Jobber nå krever booking');
    }
    if (args.status === 'available_in' && args.availableInHours == null) {
      throw new Error('Ledig om X timer krever timetall');
    }

    const now = Date.now();
    const existing = await ctx.db
      .query('cleanerStatus')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .first();
    const doc = {
      cleanerSlug: slug,
      status: args.status,
      lastSeenAt: now,
      etaMinutes: args.status === 'en_route' ? args.etaMinutes : undefined,
      currentBookingId:
        args.status === 'en_route' || args.status === 'working'
          ? args.currentBookingId
          : undefined,
      availableInHours:
        args.status === 'available_in' ? args.availableInHours : undefined,
    };
    if (existing) {
      await ctx.db.patch(existing._id, doc);
    } else {
      await ctx.db.insert('cleanerStatus', doc);
    }

    // Side-effect: when cleaner goes en_route to a booking, push ETA onto it
    // so the customer's `bookings.cleanerOnTheWay` query lights up.
    if (args.status === 'en_route' && args.currentBookingId && args.etaMinutes) {
      const booking = await ctx.db.get(args.currentBookingId);
      if (booking && booking.status !== 'pending_approval' && booking.status !== 'approved') {
        await ctx.db.patch(args.currentBookingId, {
          status: 'in_progress',
          etaMinutes: args.etaMinutes,
        });
        await ctx.scheduler.runAfter(0, internal.notifications.pushToUser, {
          userId: booking.userId,
          title: 'Renholderen er på vei',
          body: `${args.etaMinutes} min unna ${booking.address}`,
          data: { bookingId: args.currentBookingId },
        });
      }
    }
    // Clear ETA when arriving / leaving
    if (args.status === 'working' && args.currentBookingId) {
      const booking = await ctx.db.get(args.currentBookingId);
      if (booking) {
        await ctx.db.patch(args.currentBookingId, {
          status: 'in_progress',
          etaMinutes: undefined,
        });
      }
    }
  },
});

/** Cleaner-side: lightweight heartbeat — refresh lastSeenAt only. */
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const slug = await getSlugForUser(ctx);
    if (!slug) return;
    const existing = await ctx.db
      .query('cleanerStatus')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: Date.now() });
    } else {
      // First-time heartbeat: create as offline so the row exists
      await ctx.db.insert('cleanerStatus', {
        cleanerSlug: slug,
        status: 'offline',
        lastSeenAt: Date.now(),
      });
    }
  },
});

/** Cron: flip stale non-offline statuses to offline. */
export const sweepOffline = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - AUTO_OFFLINE_AFTER_MS;
    const all = await ctx.db.query('cleanerStatus').collect();
    let flipped = 0;
    for (const s of all) {
      if (s.status !== 'offline' && s.lastSeenAt < cutoff) {
        await ctx.db.patch(s._id, {
          status: 'offline',
          etaMinutes: undefined,
          currentBookingId: undefined,
          availableInHours: undefined,
        });
        flipped++;
      }
    }
    return { flipped };
  },
});
