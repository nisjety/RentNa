import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

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

    // Join cleaner display info from the cleaners table
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
      highlighted: false,
      badge: undefined,
      lastMessageAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { threadId: v.id('threads') },
  handler: async (ctx, { threadId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== identity.subject) return;
    await ctx.db.patch(threadId, { unread: false });
  },
});
