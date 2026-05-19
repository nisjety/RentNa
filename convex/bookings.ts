import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalMutation, mutation, query } from './_generated/server';

const AUTO_APPROVE_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

// ─── Cancellation tiers ──────────────────────────────────────────────────────
const FREE_CANCEL_HOURS = 24;       // ≥24h before start = no fee
const PARTIAL_CANCEL_HOURS = 4;     // 24h–4h = 50% fee; under 4h = 100%
const PARTIAL_FEE_PCT = 0.5;        // half goes to cleaner

export function computeCancellationFee(
  totalKr: number,
  startsAt: string,
  nowMs: number = Date.now(),
): {
  policy: 'free' | 'partial' | 'full';
  feeKr: number;
  refundKr: number;
  hoursUntilStart: number;
} {
  const start = new Date(startsAt).getTime();
  const hoursUntilStart = Math.max(0, (start - nowMs) / 3600000);
  if (hoursUntilStart >= FREE_CANCEL_HOURS) {
    return { policy: 'free', feeKr: 0, refundKr: totalKr, hoursUntilStart };
  }
  if (hoursUntilStart >= PARTIAL_CANCEL_HOURS) {
    const feeKr = Math.round(totalKr * PARTIAL_FEE_PCT);
    return {
      policy: 'partial',
      feeKr,
      refundKr: totalKr - feeKr,
      hoursUntilStart,
    };
  }
  return { policy: 'full', feeKr: totalKr, refundKr: 0, hoursUntilStart };
}

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

// ─── Approval flow ───────────────────────────────────────────────────────────

/**
 * Cleaner-side: mark a booking complete.
 * Moves status → 'pending_approval' and starts the 12h auto-approve timer.
 * NOTE: in v1 we trust any authenticated caller to mark their own work done;
 *       a tighter check (cleanerSlug must match assignee) lands when bookings
 *       and cleanerJobs share a primary key.
 */
export const markCompleted = mutation({
  args: { bookingId: v.id('bookings') },
  handler: async (ctx, { bookingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error('Booking ikke funnet');
    if (booking.status === 'approved' || booking.status === 'completed') {
      return; // idempotent
    }
    await ctx.db.patch(bookingId, {
      status: 'pending_approval',
      completedAt: Date.now(),
      payoutStatus: 'held',
    });
  },
});

/** Customer-side: approve a completed booking and release payout. */
export const approve = mutation({
  args: { bookingId: v.id('bookings') },
  handler: async (ctx, { bookingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error('Booking ikke funnet');
    if (booking.userId !== identity.subject) {
      throw new Error('Du kan kun godkjenne dine egne bookinger');
    }
    if (booking.status !== 'pending_approval') {
      throw new Error('Booking er ikke klar for godkjenning');
    }
    await ctx.db.patch(bookingId, {
      status: 'approved',
      approvedAt: Date.now(),
      payoutStatus: 'released',
    });
    // Capture the Vipps payment now that the customer approved
    if (booking.vippsReference) {
      await ctx.scheduler.runAfter(0, internal.vipps.capture, {
        bookingId,
        amountKr: booking.totalKr,
      });
    }
  },
});

/** Customer-side: report a problem (no-show / quality / damage / safety / other). */
export const reportProblem = mutation({
  args: {
    bookingId: v.id('bookings'),
    reason: v.string(),
    details: v.string(),
  },
  handler: async (ctx, { bookingId, reason, details }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error('Booking ikke funnet');
    if (booking.userId !== identity.subject) {
      throw new Error('Du kan kun rapportere dine egne bookinger');
    }
    const validReasons = ['quality', 'no_show', 'damage', 'safety', 'other'];
    if (!validReasons.includes(reason)) {
      throw new Error('Ugyldig årsak');
    }
    await ctx.db.patch(bookingId, {
      status: 'disputed',
      disputedAt: Date.now(),
      payoutStatus: 'held',
    });
    const reportId = await ctx.db.insert('jobReports', {
      bookingId,
      userId: identity.subject,
      reason,
      details,
      status: 'open',
      createdAt: Date.now(),
    });

    // Record a strike against the cleaner (severity by reason)
    await ctx.scheduler.runAfter(0, internal.strikes.recordStrike, {
      cleanerSlug: booking.cleanerSlug,
      bookingId,
      reportId,
      reason,
      source: 'customer_report',
      notes: details.slice(0, 240),
    });
  },
});

/** Internal: cron-driven auto-approve for bookings stuck in pending_approval > 12h. */
export const autoApproveExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - AUTO_APPROVE_WINDOW_MS;
    const stale = await ctx.db
      .query('bookings')
      .withIndex('by_status_completedAt', (q) => q.eq('status', 'pending_approval'))
      .collect();
    let released = 0;
    for (const b of stale) {
      if (b.completedAt != null && b.completedAt < cutoff) {
        await ctx.db.patch(b._id, {
          status: 'approved',
          approvedAt: Date.now(),
          autoApprovedAt: Date.now(),
          payoutStatus: 'released',
        });
        if (b.vippsReference) {
          await ctx.scheduler.runAfter(0, internal.vipps.capture, {
            bookingId: b._id,
            amountKr: b.totalKr,
          });
        }
        released++;
      }
    }
    return { released };
  },
});

// ─── Cancellation ────────────────────────────────────────────────────────────

/** Preview the fee + refund split without committing — powers the confirm sheet. */
export const cancellationPolicy = query({
  args: { bookingId: v.id('bookings') },
  handler: async (ctx, { bookingId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.userId !== identity.subject) return null;
    if (
      booking.status !== 'upcoming' &&
      booking.status !== 'in_progress'
    ) {
      return {
        canCancel: false,
        reason: 'Bookingen kan ikke avlyses i denne statusen',
        policy: 'full' as const,
        feeKr: 0,
        refundKr: 0,
        hoursUntilStart: 0,
        totalKr: booking.totalKr,
      };
    }
    const tier = computeCancellationFee(booking.totalKr, booking.startsAt);
    return {
      canCancel: true,
      totalKr: booking.totalKr,
      ...tier,
    };
  },
});

export const cancel = mutation({
  args: {
    bookingId: v.id('bookings'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { bookingId, reason }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error('Booking ikke funnet');
    if (booking.userId !== identity.subject) {
      throw new Error('Du kan kun avlyse dine egne bookinger');
    }
    if (
      booking.status !== 'upcoming' &&
      booking.status !== 'in_progress'
    ) {
      throw new Error('Bookingen kan ikke avlyses i denne statusen');
    }
    const { feeKr, refundKr } = computeCancellationFee(
      booking.totalKr,
      booking.startsAt,
    );

    await ctx.db.patch(bookingId, {
      status: 'cancelled',
      cancelledAt: Date.now(),
      cancelledBy: 'customer',
      cancellationFeeKr: feeKr,
      cancellationReason: reason?.trim()?.slice(0, 240),
      refundKr,
      payoutStatus: feeKr > 0 ? 'released' : 'cancelled',
      paymentStatus:
        refundKr === booking.totalKr
          ? 'refunded'
          : refundKr > 0
            ? 'partial_refund'
            : 'captured',
      paymentRefundedAt: refundKr > 0 ? Date.now() : undefined,
    });

    if (booking.vippsReference) {
      if (refundKr > 0 && booking.paymentStatus === 'captured') {
        // Already captured → refund the customer portion
        await ctx.scheduler.runAfter(0, internal.vipps.refund, {
          bookingId,
          amountKr: refundKr,
        });
      } else if (booking.paymentStatus === 'authorized') {
        // Not yet captured → cancel the authorisation entirely
        await ctx.scheduler.runAfter(0, internal.vipps.cancelPayment, { bookingId });
      }
    }
  },
});

// ─── Payment status ──────────────────────────────────────────────────────────

/**
 * Internal hook for Vipps / Stripe webhook to flip payment state.
 * Wired via HTTP route in a later task; for now safely callable by signed-in
 * customer for the booking they own (e.g. retry from support flow).
 */
export const updatePaymentStatus = mutation({
  args: {
    bookingId: v.id('bookings'),
    paymentStatus: v.string(),
  },
  handler: async (ctx, { bookingId, paymentStatus }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const booking = await ctx.db.get(bookingId);
    if (!booking || booking.userId !== identity.subject) {
      throw new Error('Booking ikke funnet');
    }
    const valid = ['authorized', 'captured', 'refunded', 'partial_refund', 'failed'];
    if (!valid.includes(paymentStatus)) throw new Error('Ugyldig betalingsstatus');
    await ctx.db.patch(bookingId, {
      paymentStatus,
      paymentCapturedAt:
        paymentStatus === 'captured' ? Date.now() : booking.paymentCapturedAt,
      paymentRefundedAt:
        paymentStatus === 'refunded' || paymentStatus === 'partial_refund'
          ? Date.now()
          : booking.paymentRefundedAt,
    });
  },
});

// ─── Internal patches used by the Vipps Node action ──────────────────────────
export const internalGet = internalMutation({
  args: { bookingId: v.id('bookings') },
  handler: async (ctx, { bookingId }) => ctx.db.get(bookingId),
});

export const internalSetVippsRef = internalMutation({
  args: {
    bookingId: v.id('bookings'),
    vippsReference: v.string(),
    vippsRedirectUrl: v.optional(v.string()),
  },
  handler: async (ctx, { bookingId, vippsReference, vippsRedirectUrl }) => {
    await ctx.db.patch(bookingId, { vippsReference, vippsRedirectUrl });
  },
});

export const internalApplyVippsState = internalMutation({
  args: {
    bookingId: v.id('bookings'),
    state: v.string(),
    aggregate: v.optional(v.object({
      authorizedAmount: v.optional(v.number()),
      capturedAmount: v.optional(v.number()),
      refundedAmount: v.optional(v.number()),
      cancelledAmount: v.optional(v.number()),
    })),
  },
  handler: async (ctx, { bookingId, state, aggregate }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) return;
    let paymentStatus: string = booking.paymentStatus ?? 'authorized';
    const patch: Record<string, unknown> = {};
    switch (state) {
      case 'CREATED':
        paymentStatus = 'authorized';
        break;
      case 'AUTHORIZED':
        paymentStatus = 'authorized';
        break;
      case 'CAPTURED':
        paymentStatus = 'captured';
        patch.paymentCapturedAt = Date.now();
        break;
      case 'REFUNDED':
        paymentStatus = aggregate?.refundedAmount && aggregate?.authorizedAmount
          && aggregate.refundedAmount < aggregate.authorizedAmount
          ? 'partial_refund'
          : 'refunded';
        patch.paymentRefundedAt = Date.now();
        break;
      case 'ABORTED':
      case 'EXPIRED':
      case 'TERMINATED':
        paymentStatus = 'failed';
        break;
    }
    patch.paymentStatus = paymentStatus;
    if (aggregate) patch.vippsAggregate = aggregate;
    await ctx.db.patch(bookingId, patch);
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
    const bookingId = await ctx.db.insert('bookings', {
      userId: identity.subject,
      status: 'upcoming',
      orderNumber,
      etaMinutes: undefined,
      paymentStatus: 'authorized',
      payoutStatus: 'pending',
      ...args,
    });
    // Notify the cleaner that a new booking landed
    await ctx.scheduler.runAfter(0, internal.notifications.pushToCleaner, {
      cleanerSlug: args.cleanerSlug,
      title: 'Ny booking',
      body: `${args.service} · ${new Date(args.startsAt).toLocaleString('nb-NO', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      data: { bookingId },
    });
    return bookingId;
  },
});
