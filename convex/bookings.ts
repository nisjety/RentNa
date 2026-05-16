import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return ctx.db
      .query('bookings')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .collect();
  },
});

export const getById = query({
  args: { id: v.id('bookings') },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const booking = await ctx.db.get(id);
    if (!booking || booking.userId !== identity.subject) return null;
    return booking;
  },
});

export const nextUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const now = new Date().toISOString();
    const bookings = await ctx.db
      .query('bookings')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
    const upcoming = bookings
      .filter(
        (b) =>
          ['confirmed', 'upcoming'].includes(b.status) && b.startsAt > now,
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return upcoming[0] ?? null;
  },
});

export const cleanerOnTheWay = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const bookings = await ctx.db
      .query('bookings')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
    return (
      bookings.find((b) => b.status === 'in_progress' && b.etaMinutes != null) ??
      null
    );
  },
});

export const myStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { total: 0, totalKr: 0, recurring: 0 };
    const bookings = await ctx.db
      .query('bookings')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .collect();
    const totalKr = bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalKr, 0);
    const recurring = new Set(
      bookings.filter((b) => b.recurring != null).map((b) => b.cleanerSlug),
    ).size;
    return { total: bookings.length, totalKr, recurring };
  },
});

export const create = mutation({
  args: {
    cleanerSlug: v.string(),
    cleanerName: v.string(),
    service: v.string(),
    serviceType: v.string(),
    startsAt: v.string(),
    endsAt: v.string(),
    address: v.string(),
    totalKr: v.number(),
    recurring: v.optional(v.string()),
    addOns: v.array(
      v.object({ id: v.string(), label: v.string(), priceKr: v.number() }),
    ),
    paymentBrand: v.string(),
    paymentLast4: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const orderNumber = `RN-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    return ctx.db.insert('bookings', {
      userId: identity.subject,
      status: 'upcoming',
      orderNumber,
      etaMinutes: undefined,
      ...args,
    });
  },
});
