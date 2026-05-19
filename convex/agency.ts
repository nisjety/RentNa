import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

/**
 * Resolve the agency owned by the currently signed-in user.
 * Creates one on the fly if missing (first-time agency onboarding).
 * Returns null when there is no auth context (Clerk JWT not yet configured).
 */
async function requireAgencyId(ctx: any): Promise<Id<'agencies'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const existing = await ctx.db
    .query('agencies')
    .withIndex('by_owner', (q: any) => q.eq('ownerUserId', identity.subject))
    .first();
  if (existing) return existing._id;
  return ctx.db.insert('agencies', {
    ownerUserId: identity.subject,
    name: 'Oslo Renhold AS',
    orgNumber: undefined,
    city: 'Oslo',
    createdAt: Date.now(),
  });
}

// ─── Current agency ──────────────────────────────────────────────────────────

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();
  },
});

export const ensureExists = mutation({
  args: {},
  handler: async (ctx) => {
    const id = await requireAgencyId(ctx);
    if (!id) return null;
    return ctx.db.get(id);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    orgNumber: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await requireAgencyId(ctx);
    if (!id) return null;
    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.orgNumber !== undefined) patch.orgNumber = args.orgNumber;
    if (args.city !== undefined) patch.city = args.city;
    if (Object.keys(patch).length > 0) await ctx.db.patch(id, patch);
    return ctx.db.get(id);
  },
});

// ─── Roster (cleaners in this agency) ────────────────────────────────────────

export const listMembers = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const agency = await ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();
    if (!agency) return [];
    if (status) {
      return ctx.db
        .query('agencyMembers')
        .withIndex('by_agency_status', (q) =>
          q.eq('agencyId', agency._id).eq('status', status),
        )
        .collect();
    }
    return ctx.db
      .query('agencyMembers')
      .withIndex('by_agency', (q) => q.eq('agencyId', agency._id))
      .collect();
  },
});

export const rosterStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { total: 0, onJob: 0, available: 0, off: 0, missing: 0 };
    const agency = await ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();
    if (!agency)
      return { total: 0, onJob: 0, available: 0, off: 0, missing: 0 };
    const all = await ctx.db
      .query('agencyMembers')
      .withIndex('by_agency', (q) => q.eq('agencyId', agency._id))
      .collect();
    return {
      total: all.length,
      onJob: all.filter((m) => m.status === 'on_job').length,
      available: all.filter((m) => m.status === 'available').length,
      off: all.filter((m) => m.status === 'off').length,
      missing: all.filter((m) => m.status === 'missing').length,
    };
  },
});

export const setMemberStatus = mutation({
  args: { memberId: v.id('agencyMembers'), status: v.string() },
  handler: async (ctx, { memberId, status }) => {
    const __aid = await requireAgencyId(ctx);
    if (!__aid) throw new Error('Konfigurer Clerk JWT-mal "convex" og logg inn på nytt.');
    await ctx.db.patch(memberId, { status });
  },
});

// ─── Requests dispatch ───────────────────────────────────────────────────────

export const listRequests = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const agency = await ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();
    if (!agency) return [];
    if (status) {
      return ctx.db
        .query('requests')
        .withIndex('by_agency_status', (q) =>
          q.eq('agencyId', agency._id).eq('status', status),
        )
        .order('desc')
        .collect();
    }
    return ctx.db
      .query('requests')
      .withIndex('by_agency', (q) => q.eq('agencyId', agency._id))
      .order('desc')
      .collect();
  },
});

export const requestCounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { new: 0, suggested: 0, confirmed: 0, declined: 0 };
    const agency = await ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();
    if (!agency) return { new: 0, suggested: 0, confirmed: 0, declined: 0 };
    const all = await ctx.db
      .query('requests')
      .withIndex('by_agency', (q) => q.eq('agencyId', agency._id))
      .collect();
    return {
      new: all.filter((r) => r.status === 'new').length,
      suggested: all.filter((r) => r.status === 'suggested').length,
      confirmed: all.filter((r) => r.status === 'confirmed').length,
      declined: all.filter((r) => r.status === 'declined').length,
    };
  },
});

export const assignRequest = mutation({
  args: { requestId: v.id('requests'), cleanerSlug: v.string() },
  handler: async (ctx, { requestId, cleanerSlug }) => {
    const __aid = await requireAgencyId(ctx);
    if (!__aid) throw new Error('Konfigurer Clerk JWT-mal "convex" og logg inn på nytt.');
    await ctx.db.patch(requestId, {
      assignedCleanerSlug: cleanerSlug,
      status: 'confirmed',
    });
  },
});

export const declineRequest = mutation({
  args: { requestId: v.id('requests') },
  handler: async (ctx, { requestId }) => {
    const __aid = await requireAgencyId(ctx);
    if (!__aid) throw new Error('Konfigurer Clerk JWT-mal "convex" og logg inn på nytt.');
    await ctx.db.patch(requestId, { status: 'declined' });
  },
});

export const broadcastRequest = mutation({
  args: { requestId: v.id('requests') },
  handler: async (ctx, { requestId }) => {
    const __aid = await requireAgencyId(ctx);
    if (!__aid) throw new Error('Konfigurer Clerk JWT-mal "convex" og logg inn på nytt.');
    await ctx.db.patch(requestId, { status: 'suggested' });
  },
});

// ─── Coverage / Calendar ─────────────────────────────────────────────────────

function mondayISO(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow; // Monday = 1
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const listShifts = query({
  args: { weekStart: v.optional(v.string()) },
  handler: async (ctx, { weekStart }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const agency = await ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();
    if (!agency) return [];
    const wk = weekStart ?? mondayISO();
    return ctx.db
      .query('shifts')
      .withIndex('by_agency_week', (q) =>
        q.eq('agencyId', agency._id).eq('weekStart', wk),
      )
      .collect();
  },
});

export const coverageStats = query({
  args: { weekStart: v.optional(v.string()) },
  handler: async (ctx, { weekStart }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      return { coveragePct: 0, openHours: 0, capacityPct: 0 };
    const agency = await ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();
    if (!agency)
      return { coveragePct: 0, openHours: 0, capacityPct: 0 };
    const wk = weekStart ?? mondayISO();
    const shifts = await ctx.db
      .query('shifts')
      .withIndex('by_agency_week', (q) =>
        q.eq('agencyId', agency._id).eq('weekStart', wk),
      )
      .collect();
    const members = await ctx.db
      .query('agencyMembers')
      .withIndex('by_agency', (q) => q.eq('agencyId', agency._id))
      .collect();
    const bookedHours = shifts
      .filter((s) => s.kind === 'booking' || s.kind === 'shift')
      .reduce((sum, s) => sum + Math.max(0, s.endHour - s.startHour), 0);
    const capacityHours = members.length * 8 * 5; // 8h × 5 days
    const coveragePct = capacityHours
      ? Math.min(100, Math.round((bookedHours / capacityHours) * 100))
      : 0;
    const openHours = Math.max(0, capacityHours - bookedHours);
    return {
      coveragePct,
      openHours,
      capacityPct: Math.min(100, Math.round((bookedHours / Math.max(1, capacityHours)) * 100)),
    };
  },
});

// ─── Økonomi (financial summary) ─────────────────────────────────────────────

export const earningsSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { monthKr: 0, ytdKr: 0, openInvoicesKr: 0 };
    const agency = await ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();
    if (!agency) return { monthKr: 0, ytdKr: 0, openInvoicesKr: 0 };

    // Derive revenue from confirmed requests (proxy for invoiced revenue)
    const requests = await ctx.db
      .query('requests')
      .withIndex('by_agency_status', (q) =>
        q.eq('agencyId', agency._id).eq('status', 'confirmed'),
      )
      .collect();

    const now = new Date();
    const month = now.toISOString().slice(0, 7); // YYYY-MM
    const year = now.toISOString().slice(0, 4);

    const monthKr = requests
      .filter((r) => r.startsAt.startsWith(month))
      .reduce((s, r) => s + r.valueKr, 0);
    const ytdKr = requests
      .filter((r) => r.startsAt.startsWith(year))
      .reduce((s, r) => s + r.valueKr, 0);
    const openInvoicesKr = requests
      .filter((r) => r.startsAt > now.toISOString())
      .reduce((s, r) => s + r.valueKr, 0);

    return { monthKr, ytdKr, openInvoicesKr };
  },
});
