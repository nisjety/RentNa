import { v } from 'convex/values';

import { internal } from './_generated/api';
import { mutation, query } from './_generated/server';

// ─── Resolve the cleaner slug for the signed-in cleaner-pro user ──────────
async function getMyCleanerSlug(ctx: any): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const profile = await ctx.db
    .query('cleanerProfiles')
    .withIndex('by_user', (q: any) => q.eq('userId', identity.subject))
    .first();
  return profile?.cleanerSlug ?? null;
}

// ─── Customer-side thread list ────────────────────────────────────────────
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const threads = await ctx.db
      .query('threads')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();
    const results = await Promise.all(
      threads.map(async (t) => {
        const cleaner = await ctx.db
          .query('cleaners')
          .withIndex('by_slug', (q) => q.eq('slug', t.cleanerSlug))
          .first();
        return {
          ...t,
          cleanerShortName: cleaner?.shortName ?? t.cleanerSlug,
          cleanerInitials: cleaner?.initials ?? '??',
        };
      }),
    );
    return results;
  },
});

// ─── Cleaner-pro thread list ──────────────────────────────────────────────
export const listForCleaner = query({
  args: {},
  handler: async (ctx) => {
    const slug = await getMyCleanerSlug(ctx);
    if (!slug) return [];
    const threads = await ctx.db
      .query('threads')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .order('desc')
      .collect();
    return threads.map((t) => ({
      ...t,
      // The "other party" from the cleaner's perspective is the customer.
      // We can't read Clerk profile data server-side, so the UI falls
      // back to "Kunde" or last message preview.
      customerLabel: `Kunde ${t.userId.slice(-4)}`,
    }));
  },
});

// ─── Single thread with metadata (customer OR cleaner perspective) ────────
export const getById = query({
  args: { threadId: v.id('threads') },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const thread = await ctx.db.get(threadId);
    if (!thread) return null;
    const cleanerSlug = await getMyCleanerSlug(ctx);
    const isOwner = thread.userId === identity.subject;
    const isCleaner = cleanerSlug != null && thread.cleanerSlug === cleanerSlug;
    if (!isOwner && !isCleaner) return null;
    const cleaner = await ctx.db
      .query('cleaners')
      .withIndex('by_slug', (q) => q.eq('slug', thread.cleanerSlug))
      .first();
    return {
      ...thread,
      role: isCleaner ? 'cleaner' : 'customer',
      cleanerShortName: cleaner?.shortName ?? thread.cleanerSlug,
      cleanerInitials: cleaner?.initials ?? '??',
      cleanerAvatarKey: cleaner?.slug,
    };
  },
});

// ─── Get-or-create from customer side ────────────────────────────────────
export const getOrCreate = mutation({
  args: { cleanerSlug: v.string(), cleanerName: v.string() },
  handler: async (ctx, { cleanerSlug, cleanerName }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const existing = await ctx.db
      .query('threads')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
    const thread = existing.find((t) => t.cleanerSlug === cleanerSlug);
    if (thread) return thread._id;
    return ctx.db.insert('threads', {
      userId: identity.subject,
      cleanerSlug,
      preview: `Ny samtale med ${cleanerName}`,
      unread: false,
      unreadCleaner: false,
      highlighted: false,
      badge: undefined,
      lastMessageAt: Date.now(),
    });
  },
});

// ─── Mark read (per role) ────────────────────────────────────────────────
export const markRead = mutation({
  args: { threadId: v.id('threads') },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const thread = await ctx.db.get(threadId);
    if (!thread) return;
    const cleanerSlug = await getMyCleanerSlug(ctx);
    if (thread.userId === identity.subject) {
      await ctx.db.patch(threadId, { unread: false });
    } else if (cleanerSlug && thread.cleanerSlug === cleanerSlug) {
      await ctx.db.patch(threadId, { unreadCleaner: false });
    }
  },
});

// ─── Messages: list + send ───────────────────────────────────────────────
export const listMessages = query({
  args: { threadId: v.id('threads') },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const thread = await ctx.db.get(threadId);
    if (!thread) return [];
    const cleanerSlug = await getMyCleanerSlug(ctx);
    const isOwner = thread.userId === identity.subject;
    const isCleaner = cleanerSlug != null && thread.cleanerSlug === cleanerSlug;
    if (!isOwner && !isCleaner) return [];
    return ctx.db
      .query('messages')
      .withIndex('by_thread', (q) => q.eq('threadId', threadId))
      .order('asc')
      .collect();
  },
});

export const sendMessage = mutation({
  args: { threadId: v.id('threads'), text: v.string() },
  handler: async (ctx, { threadId, text }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const trimmed = text.trim();
    if (trimmed.length === 0) throw new Error('Tom melding');
    if (trimmed.length > 2000) throw new Error('Meldingen er for lang');
    const thread = await ctx.db.get(threadId);
    if (!thread) throw new Error('Samtale ikke funnet');
    const cleanerSlug = await getMyCleanerSlug(ctx);
    const isOwner = thread.userId === identity.subject;
    const isCleaner = cleanerSlug != null && thread.cleanerSlug === cleanerSlug;
    if (!isOwner && !isCleaner) {
      throw new Error('Du er ikke deltaker i denne samtalen');
    }
    await ctx.db.insert('messages', {
      threadId,
      senderId: identity.subject,
      text: trimmed,
      createdAt: Date.now(),
    });
    // Bump preview + flip unread on the OTHER side.
    await ctx.db.patch(threadId, {
      preview: trimmed.length > 80 ? trimmed.slice(0, 80) + '…' : trimmed,
      lastMessageAt: Date.now(),
      unread: isCleaner ? true : thread.unread,
      unreadCleaner: isOwner ? true : (thread.unreadCleaner ?? false),
    });

    // Notify the OTHER party
    const previewBody = trimmed.length > 120 ? trimmed.slice(0, 120) + '…' : trimmed;
    if (isOwner) {
      // Customer wrote → push to cleaner
      await ctx.scheduler.runAfter(0, internal.notifications.pushToCleaner, {
        cleanerSlug: thread.cleanerSlug,
        title: 'Ny melding fra kunde',
        body: previewBody,
        data: { threadId },
      });
    } else {
      // Cleaner wrote → push to customer
      await ctx.scheduler.runAfter(0, internal.notifications.pushToUser, {
        userId: thread.userId,
        title: 'Ny melding fra renholder',
        body: previewBody,
        data: { threadId },
      });
    }
  },
});

// ─── Unread counter (for tab badges) ─────────────────────────────────────
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const cleanerSlug = await getMyCleanerSlug(ctx);
    if (cleanerSlug) {
      const threads = await ctx.db
        .query('threads')
        .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', cleanerSlug))
        .collect();
      return threads.filter((t) => t.unreadCleaner).length;
    }
    const threads = await ctx.db
      .query('threads')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
    return threads.filter((t) => t.unread).length;
  },
});
