import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// ─── Profile / identity ──────────────────────────────────────────────────────

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query('cleanerProfiles')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first();
    if (!profile) return null;
    const cleaner = await ctx.db
      .query('cleaners')
      .withIndex('by_slug', (q) => q.eq('slug', profile.cleanerSlug))
      .first();
    return { profile, cleaner };
  },
});

export const ensureProfile = mutation({
  args: { cleanerSlug: v.optional(v.string()) },
  handler: async (ctx, { cleanerSlug }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null; // No-op when Clerk JWT template not configured
    const existing = await ctx.db
      .query('cleanerProfiles')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first();
    if (existing) return existing._id;
    const slug = cleanerSlug ?? 'cl_maja';
    return ctx.db.insert('cleanerProfiles', {
      userId: identity.subject,
      cleanerSlug: slug,
      payoutMethod: 'vipps',
      payoutLast4: '4567',
      createdAt: Date.now(),
    });
  },
});

async function requireSlug(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new Error('Konfigurer Clerk JWT-mal "convex" og logg inn på nytt.');
  const profile = await ctx.db
    .query('cleanerProfiles')
    .withIndex('by_user', (q: any) => q.eq('userId', identity.subject))
    .first();
  if (!profile) throw new Error('Ingen renholder-profil. Logg inn igjen.');
  return profile.cleanerSlug;
}

async function resolveSlug(ctx: any): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const profile = await ctx.db
    .query('cleanerProfiles')
    .withIndex('by_user', (q: any) => q.eq('userId', identity.subject))
    .first();
  return profile?.cleanerSlug ?? null;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const todayJobs = query({
  args: {},
  handler: async (ctx) => {
    const slug = await resolveSlug(ctx);
    if (!slug) return [];
    const all = await ctx.db
      .query('cleanerJobs')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .collect();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    return all
      .filter((j) => j.startsAt.slice(0, 10) === todayStr)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  },
});

export const activeJob = query({
  args: {},
  handler: async (ctx) => {
    const slug = await resolveSlug(ctx);
    if (!slug) return null;
    return ctx.db
      .query('cleanerJobs')
      .withIndex('by_cleaner_status', (q) =>
        q.eq('cleanerSlug', slug).eq('status', 'in_progress'),
      )
      .first();
  },
});

export const dayStats = query({
  args: {},
  handler: async (ctx) => {
    const slug = await resolveSlug(ctx);
    if (!slug) return { totalKr: 0, jobsCount: 0, completedCount: 0 };
    const all = await ctx.db
      .query('cleanerJobs')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .collect();
    const todayStr = new Date().toISOString().slice(0, 10);
    const today = all.filter((j) => j.startsAt.slice(0, 10) === todayStr);
    return {
      totalKr: today.reduce((s, j) => s + j.totalKr, 0),
      jobsCount: today.length,
      completedCount: today.filter((j) => j.status === 'completed').length,
    };
  },
});

export const getJob = query({
  args: { jobId: v.id('cleanerJobs') },
  handler: async (ctx, { jobId }) => {
    const slug = await resolveSlug(ctx);
    if (!slug) return null;
    const job = await ctx.db.get(jobId);
    if (!job || job.cleanerSlug !== slug) return null;
    return job;
  },
});

export const toggleChecklistItem = mutation({
  args: { jobId: v.id('cleanerJobs'), itemId: v.string() },
  handler: async (ctx, { jobId, itemId }) => {
    const slug = await requireSlug(ctx);
    const job = await ctx.db.get(jobId);
    if (!job || job.cleanerSlug !== slug) throw new Error('Job ikke funnet');
    const newChecklist = job.checklist.map((c) =>
      c.id === itemId ? { ...c, done: !c.done } : c,
    );
    await ctx.db.patch(jobId, { checklist: newChecklist });
  },
});

export const markJobComplete = mutation({
  args: { jobId: v.id('cleanerJobs') },
  handler: async (ctx, { jobId }) => {
    const slug = await requireSlug(ctx);
    const job = await ctx.db.get(jobId);
    if (!job || job.cleanerSlug !== slug) throw new Error('Job ikke funnet');
    await ctx.db.patch(jobId, { status: 'completed', completedAt: Date.now() });

    // Best-effort link: flip the matching customer booking to pending_approval
    // by (cleanerSlug, startsAt). Skipped silently if no match.
    const matchingBookings = await ctx.db
      .query('bookings')
      .filter((q) =>
        q.and(
          q.eq(q.field('cleanerSlug'), job.cleanerSlug),
          q.eq(q.field('startsAt'), job.startsAt),
        ),
      )
      .collect();
    for (const booking of matchingBookings) {
      if (
        booking.status === 'approved' ||
        booking.status === 'completed' ||
        booking.status === 'disputed'
      ) {
        continue;
      }
      await ctx.db.patch(booking._id, {
        status: 'pending_approval',
        completedAt: Date.now(),
        payoutStatus: 'held',
      });
    }
  },
});

// ─── Requests (incoming customer offers) ─────────────────────────────────────

export const listRequests = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    const slug = await resolveSlug(ctx);
    if (!slug) return [];
    if (status) {
      return ctx.db
        .query('jobRequests')
        .withIndex('by_cleaner_status', (q) =>
          q.eq('cleanerSlug', slug).eq('status', status),
        )
        .order('desc')
        .collect();
    }
    return ctx.db
      .query('jobRequests')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .order('desc')
      .collect();
  },
});

export const acceptRequest = mutation({
  args: { requestId: v.id('jobRequests') },
  handler: async (ctx, { requestId }) => {
    const slug = await requireSlug(ctx);
    const req = await ctx.db.get(requestId);
    if (!req || req.cleanerSlug !== slug) throw new Error('Forespørsel ikke funnet');
    await ctx.db.patch(requestId, { status: 'accepted' });

    // Materialise into a cleanerJob in 'upcoming' state
    await ctx.db.insert('cleanerJobs', {
      cleanerSlug: slug,
      customerName: req.customerName,
      customerInitials: req.customerInitials,
      address: req.address,
      area: req.area,
      service: req.service,
      serviceType: req.serviceType,
      startsAt: req.proposedDate,
      durationHours: req.durationHours,
      status: 'upcoming',
      hourlyRateKr: req.proposedRateKr,
      totalKr: Math.round(req.proposedRateKr * req.durationHours),
      checklist: [],
    });
  },
});

export const declineRequest = mutation({
  args: { requestId: v.id('jobRequests') },
  handler: async (ctx, { requestId }) => {
    const slug = await requireSlug(ctx);
    const req = await ctx.db.get(requestId);
    if (!req || req.cleanerSlug !== slug) throw new Error('Forespørsel ikke funnet');
    await ctx.db.patch(requestId, { status: 'declined' });
  },
});

// ─── Availability ────────────────────────────────────────────────────────────

function mondayISO(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const availabilityWeek = query({
  args: { weekStart: v.optional(v.string()) },
  handler: async (ctx, { weekStart }) => {
    const slug = await resolveSlug(ctx);
    if (!slug) return { weekStart: mondayISO(), slots: [] as string[] };
    const wk = weekStart ?? mondayISO();
    const doc = await ctx.db
      .query('cleanerAvailability')
      .withIndex('by_cleaner_week', (q) =>
        q.eq('cleanerSlug', slug).eq('weekStart', wk),
      )
      .first();
    return { weekStart: wk, slots: doc?.slots ?? [] };
  },
});

export const setAvailability = mutation({
  args: { weekStart: v.string(), slots: v.array(v.string()) },
  handler: async (ctx, { weekStart, slots }) => {
    const slug = await requireSlug(ctx);
    const existing = await ctx.db
      .query('cleanerAvailability')
      .withIndex('by_cleaner_week', (q) =>
        q.eq('cleanerSlug', slug).eq('weekStart', weekStart),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { slots });
    } else {
      await ctx.db.insert('cleanerAvailability', {
        cleanerSlug: slug,
        weekStart,
        slots,
      });
    }
  },
});

// ─── Earnings & payouts ──────────────────────────────────────────────────────

export const earningsSummary = query({
  args: {},
  handler: async (ctx) => {
    const slug = await resolveSlug(ctx);
    const empty = {
      thisWeek: { totalKr: 0, jobsCount: 0, hoursWorked: 0 },
      thisMonth: { totalKr: 0, jobsCount: 0, hoursWorked: 0 },
      ytd: { totalKr: 0, jobsCount: 0, hoursWorked: 0 },
      monthlyBars: [] as { month: string; kr: number }[],
    };
    if (!slug) return empty;

    const jobs = (
      await ctx.db
        .query('cleanerJobs')
        .withIndex('by_cleaner_status', (q) =>
          q.eq('cleanerSlug', slug).eq('status', 'completed'),
        )
        .collect()
    ).filter((j) => j.completedAt != null);

    const now = new Date();
    const startOfWeek = new Date(now);
    const dow = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (dow === 0 ? 6 : dow - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    function agg(filtered: typeof jobs) {
      return {
        totalKr: filtered.reduce((s, j) => s + j.totalKr, 0),
        jobsCount: filtered.length,
        hoursWorked: Math.round(filtered.reduce((s, j) => s + j.durationHours, 0)),
      };
    }

    const inWeek = jobs.filter((j) => (j.completedAt ?? 0) >= startOfWeek.getTime());
    const inMonth = jobs.filter((j) => (j.completedAt ?? 0) >= startOfMonth.getTime());
    const inYear = jobs.filter((j) => (j.completedAt ?? 0) >= startOfYear.getTime());

    // Monthly bars: last 5 months
    const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyBars: { month: string; kr: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const month = (now.getMonth() - i + 12) % 12;
      const year = now.getFullYear() - (now.getMonth() - i < 0 ? 1 : 0);
      const start = new Date(year, month, 1).getTime();
      const end = new Date(year, month + 1, 1).getTime();
      const monthJobs = jobs.filter(
        (j) => (j.completedAt ?? 0) >= start && (j.completedAt ?? 0) < end,
      );
      monthlyBars.push({
        month: MONTH[month],
        kr: monthJobs.reduce((s, j) => s + j.totalKr, 0),
      });
    }

    return {
      thisWeek: agg(inWeek),
      thisMonth: agg(inMonth),
      ytd: agg(inYear),
      monthlyBars,
    };
  },
});

export const listPayouts = query({
  args: {},
  handler: async (ctx) => {
    const slug = await resolveSlug(ctx);
    if (!slug) return [];
    const all = await ctx.db
      .query('cleanerPayouts')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .order('desc')
      .collect();
    return all;
  },
});
