/**
 * Internal queries used by the Node notifications module. Convex Node
 * actions can only call other queries/mutations indirectly, so these
 * helpers live in a non-node file.
 */
import { v } from 'convex/values';

import { internalQuery, mutation, query } from './_generated/server';

/**
 * Returns the Convex-side identity for the signed-in caller, or null if
 * Convex can't see the Clerk JWT (template "convex" missing).
 * Used by the auth-setup banner.
 */
export const whoami = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity ? { subject: identity.subject } : null;
  },
});

/** Register the device's Expo push token for the signed-in user. */
export const registerToken = mutation({
  args: {
    token: v.string(),
    platform: v.string(),
    cleanerSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const existing = await ctx.db
      .query('pushTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: identity.subject,
        platform: args.platform,
        cleanerSlug: args.cleanerSlug,
        lastSeenAt: Date.now(),
      });
      return;
    }
    await ctx.db.insert('pushTokens', {
      userId: identity.subject,
      token: args.token,
      platform: args.platform,
      cleanerSlug: args.cleanerSlug,
      lastSeenAt: Date.now(),
    });
  },
});

export const tokensByUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query('pushTokens')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect(),
});

export const tokensByCleaner = internalQuery({
  args: { cleanerSlug: v.string() },
  handler: async (ctx, { cleanerSlug }) =>
    ctx.db
      .query('pushTokens')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', cleanerSlug))
      .collect(),
});
