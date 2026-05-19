import { v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';

const STRIKE_WINDOW_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const SUSPEND_THRESHOLD = 5;

// Severity per reported reason. Tune via product feedback.
const SEVERITY_BY_REASON: Record<string, number> = {
  no_show: 2,
  damage:  2,
  safety:  3,
  quality: 1,
  other:   1,
};

export function severityFor(reason: string): number {
  return SEVERITY_BY_REASON[reason] ?? 1;
}

/**
 * Record a strike against a cleaner and auto-suspend if the rolling
 * 90-day point total has crossed the threshold. Called by
 * `bookings.reportProblem` and by future admin tooling.
 */
export const recordStrike = internalMutation({
  args: {
    cleanerSlug: v.string(),
    bookingId: v.optional(v.id('bookings')),
    reportId: v.optional(v.id('jobReports')),
    reason: v.string(),
    source: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const severity = severityFor(args.reason);
    await ctx.db.insert('cleanerStrikes', {
      cleanerSlug: args.cleanerSlug,
      bookingId: args.bookingId,
      reportId: args.reportId,
      reason: args.reason,
      severity,
      source: args.source,
      notes: args.notes,
      createdAt: now,
      expiresAt: now + STRIKE_WINDOW_MS,
    });

    // Recompute rolling totals
    const active = await ctx.db
      .query('cleanerStrikes')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', args.cleanerSlug))
      .collect();
    const liveTotal = active
      .filter((s) => s.expiresAt > now && s.resolvedAt == null)
      .reduce((sum, s) => sum + s.severity, 0);

    // Denormalise onto cleaners row for fast filtering
    const cleaner = await ctx.db
      .query('cleaners')
      .withIndex('by_slug', (q) => q.eq('slug', args.cleanerSlug))
      .first();
    if (!cleaner) return { liveTotal, suspended: false };

    const shouldSuspend = liveTotal >= SUSPEND_THRESHOLD && cleaner.suspendedAt == null;
    await ctx.db.patch(cleaner._id, {
      strikePoints: liveTotal,
      ...(shouldSuspend
        ? {
            suspendedAt: now,
            suspendedReason: `Auto-suspendert ved ${liveTotal} strike-poeng`,
          }
        : {}),
    });
    return { liveTotal, suspended: shouldSuspend };
  },
});

// ─── Read-side queries ───────────────────────────────────────────────────

/** Cleaner-pro: own active strikes for the profile screen. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { strikes: [], total: 0, suspended: false };
    const profile = await ctx.db
      .query('cleanerProfiles')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first();
    if (!profile) return { strikes: [], total: 0, suspended: false };

    const cleaner = await ctx.db
      .query('cleaners')
      .withIndex('by_slug', (q) => q.eq('slug', profile.cleanerSlug))
      .first();
    const now = Date.now();
    const all = await ctx.db
      .query('cleanerStrikes')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', profile.cleanerSlug))
      .collect();
    const active = all
      .filter((s) => s.expiresAt > now && s.resolvedAt == null)
      .sort((a, b) => b.createdAt - a.createdAt);
    const total = active.reduce((sum, s) => sum + s.severity, 0);
    return {
      strikes: active,
      total,
      suspended: cleaner?.suspendedAt != null,
      suspendedReason: cleaner?.suspendedReason,
      threshold: SUSPEND_THRESHOLD,
    };
  },
});

/** Admin / agency: list strikes for a specific cleaner. */
export const listForCleaner = query({
  args: { cleanerSlug: v.string() },
  handler: async (ctx, { cleanerSlug }) => {
    const all = await ctx.db
      .query('cleanerStrikes')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', cleanerSlug))
      .collect();
    const now = Date.now();
    return all
      .map((s) => ({ ...s, active: s.expiresAt > now && s.resolvedAt == null }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Manual lift (will be wired to admin UI later). */
export const resolveStrike = mutation({
  args: { strikeId: v.id('cleanerStrikes') },
  handler: async (ctx, { strikeId }) => {
    // Stub for now — full admin auth lands in the support tools task
    const strike = await ctx.db.get(strikeId);
    if (!strike || strike.resolvedAt) return;
    await ctx.db.patch(strikeId, { resolvedAt: Date.now() });

    // Recompute and possibly un-suspend the cleaner
    const all = await ctx.db
      .query('cleanerStrikes')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', strike.cleanerSlug))
      .collect();
    const now = Date.now();
    const liveTotal = all
      .filter((s) => s.expiresAt > now && s.resolvedAt == null && s._id !== strikeId)
      .reduce((sum, s) => sum + s.severity, 0);
    const cleaner = await ctx.db
      .query('cleaners')
      .withIndex('by_slug', (q) => q.eq('slug', strike.cleanerSlug))
      .first();
    if (!cleaner) return;
    await ctx.db.patch(cleaner._id, {
      strikePoints: liveTotal,
      ...(liveTotal < SUSPEND_THRESHOLD && cleaner.suspendedAt != null
        ? { suspendedAt: undefined, suspendedReason: undefined }
        : {}),
    });
  },
});
