import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  cleaners: defineTable({
    slug: v.string(),
    name: v.string(),
    shortName: v.string(),
    initials: v.string(),
    area: v.string(),
    city: v.string(),
    yearsExperience: v.number(),
    hourlyRateKr: v.number(),
    rating: v.number(),
    reviewCount: v.number(),
    jobsCompleted: v.number(),
    isSuperCleaner: v.boolean(),
    isVerified: v.boolean(),
    bio: v.string(),
    tags: v.array(v.string()),
    services: v.array(v.string()),
    agencyIds: v.array(v.string()),
    // ── Trust & safety ──────────────────────────────────────────────
    strikePoints: v.optional(v.number()),       // rolling 90-day total
    suspendedAt: v.optional(v.number()),        // null if active
    suspendedReason: v.optional(v.string()),
  }).index('by_slug', ['slug']),

  pushTokens: defineTable({
    userId: v.string(),         // Clerk user id
    token: v.string(),          // ExponentPushToken[xxx]
    platform: v.string(),       // 'ios' | 'android'
    cleanerSlug: v.optional(v.string()),  // populated for cleaner-pro users
    lastSeenAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_token', ['token'])
    .index('by_cleaner', ['cleanerSlug']),

  cleanerStrikes: defineTable({
    cleanerSlug: v.string(),
    bookingId: v.optional(v.id('bookings')),
    reportId: v.optional(v.id('jobReports')),
    reason: v.string(),       // mirrors jobReports.reason
    severity: v.number(),     // 1, 2, 3
    source: v.string(),       // 'customer_report' | 'admin' | 'system'
    notes: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),    // createdAt + 90 days
    resolvedAt: v.optional(v.number()),  // when support cleared it
  })
    .index('by_cleaner', ['cleanerSlug'])
    .index('by_cleaner_expires', ['cleanerSlug', 'expiresAt']),

  reviews: defineTable({
    cleanerSlug: v.string(),
    authorName: v.string(),
    authorAvatarKey: v.optional(v.string()),
    rating: v.number(),
    text: v.string(),
    createdAt: v.number(),
  }).index('by_cleaner', ['cleanerSlug']),

  bookings: defineTable({
    userId: v.string(),
    cleanerSlug: v.string(),
    cleanerName: v.string(),
    service: v.string(),
    serviceType: v.string(),
    startsAt: v.string(),
    endsAt: v.string(),
    address: v.string(),
    // status: 'upcoming' | 'in_progress' | 'pending_approval' | 'approved' | 'completed' | 'disputed' | 'cancelled'
    status: v.string(),
    orderNumber: v.string(),
    totalKr: v.number(),
    recurring: v.optional(v.string()),
    addOns: v.array(
      v.object({ id: v.string(), label: v.string(), priceKr: v.number() }),
    ),
    paymentBrand: v.string(),
    paymentLast4: v.string(),
    etaMinutes: v.optional(v.number()),
    // ── Approval / payout state machine ───────────────────────────────
    completedAt: v.optional(v.number()),     // when cleaner marked done
    approvedAt: v.optional(v.number()),      // when customer (or cron) approved
    autoApprovedAt: v.optional(v.number()),  // separate flag if auto-released
    disputedAt: v.optional(v.number()),      // when customer raised a problem
    payoutStatus: v.optional(v.string()),    // 'pending' | 'released' | 'held'
    // ── Cancellation ──────────────────────────────────────────────────
    cancelledAt: v.optional(v.number()),
    cancelledBy: v.optional(v.string()),     // 'customer' | 'cleaner' | 'system'
    cancellationFeeKr: v.optional(v.number()),
    cancellationReason: v.optional(v.string()),
    refundKr: v.optional(v.number()),
    // ── Payment state machine ─────────────────────────────────────────
    // 'authorized' | 'captured' | 'refunded' | 'partial_refund' | 'failed'
    paymentStatus: v.optional(v.string()),
    paymentCapturedAt: v.optional(v.number()),
    paymentRefundedAt: v.optional(v.number()),
    // ── Vipps ─────────────────────────────────────────────────────────
    vippsReference: v.optional(v.string()),     // our reference, sent to Vipps
    vippsRedirectUrl: v.optional(v.string()),
    vippsAggregate: v.optional(v.object({       // raw amounts in øre, last seen
      authorizedAmount: v.optional(v.number()),
      capturedAmount: v.optional(v.number()),
      refundedAmount: v.optional(v.number()),
      cancelledAmount: v.optional(v.number()),
    })),
    customerPhone: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_status_completedAt', ['status', 'completedAt']),

  jobReports: defineTable({
    bookingId: v.id('bookings'),
    userId: v.string(),       // who reported (customer's clerk id)
    reason: v.string(),       // 'quality' | 'no_show' | 'damage' | 'safety' | 'other'
    details: v.string(),
    status: v.string(),       // 'open' | 'resolved' | 'refunded'
    createdAt: v.number(),
  })
    .index('by_booking', ['bookingId'])
    .index('by_user', ['userId']),

  threads: defineTable({
    userId: v.string(),                     // customer's Clerk id
    cleanerSlug: v.string(),
    preview: v.string(),
    unread: v.boolean(),                    // unread for the customer
    unreadCleaner: v.optional(v.boolean()), // unread for the cleaner
    highlighted: v.boolean(),
    badge: v.optional(v.string()),
    lastMessageAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_cleaner', ['cleanerSlug']),

  messages: defineTable({
    threadId: v.id('threads'),
    senderId: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index('by_thread', ['threadId']),

  // ─── Agency workspace ──────────────────────────────────────────────
  agencies: defineTable({
    ownerUserId: v.string(),          // Clerk user.id of the agency owner
    name: v.string(),
    orgNumber: v.optional(v.string()),
    city: v.string(),
    createdAt: v.number(),
  }).index('by_owner', ['ownerUserId']),

  agencyMembers: defineTable({
    agencyId: v.id('agencies'),
    cleanerSlug: v.string(),          // FK → cleaners.slug
    name: v.string(),                 // Denormalised for fast lists
    initials: v.string(),
    tone: v.string(),                 // Hex colour for striped avatar
    area: v.string(),
    status: v.string(),               // 'on_job' | 'available' | 'off' | 'missing'
    hoursToday: v.number(),
    hoursWeek: v.number(),
    fasteCount: v.number(),           // # recurring customers
    joinedAt: v.number(),
  })
    .index('by_agency', ['agencyId'])
    .index('by_agency_status', ['agencyId', 'status']),

  requests: defineTable({
    agencyId: v.id('agencies'),
    orderNum: v.string(),
    clientName: v.string(),
    area: v.string(),
    address: v.string(),
    service: v.string(),              // 'Hjemvask', 'Dypvask', …
    recurring: v.string(),            // 'ukentlig', '1 gang', …
    valueKr: v.number(),
    valuePeriod: v.string(),          // 'mnd' | 'gang'
    startsAt: v.string(),             // ISO
    endsAt: v.string(),               // ISO
    priority: v.string(),             // 'HØY' | 'MEDIUM' | 'LAV'
    status: v.string(),               // 'new' | 'suggested' | 'confirmed' | 'declined'
    assignedCleanerSlug: v.optional(v.string()),
    autoMatchCleanerSlug: v.optional(v.string()),
    autoMatchScore: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_agency', ['agencyId'])
    .index('by_agency_status', ['agencyId', 'status']),

  shifts: defineTable({
    agencyId: v.id('agencies'),
    cleanerSlug: v.string(),
    dayIndex: v.number(),             // 0=Mon … 6=Sun (relative to week start)
    weekStart: v.string(),            // YYYY-MM-DD of the Monday
    startHour: v.number(),            // 0–23
    endHour: v.number(),
    kind: v.string(),                 // 'shift' | 'booking' | 'off'
    label: v.optional(v.string()),    // e.g. "Lillian B."
  })
    .index('by_agency_week', ['agencyId', 'weekStart'])
    .index('by_agency_cleaner_week', ['agencyId', 'cleanerSlug', 'weekStart']),

  // ─── Cleaner Pro workspace ─────────────────────────────────────────────────
  cleanerProfiles: defineTable({
    userId: v.string(),               // Clerk user.id
    cleanerSlug: v.string(),          // FK → cleaners.slug
    payoutMethod: v.optional(v.string()),   // 'vipps' | 'bank'
    payoutLast4: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_slug', ['cleanerSlug']),

  jobRequests: defineTable({
    cleanerSlug: v.string(),
    status: v.string(),               // 'pending' | 'accepted' | 'declined'
    customerName: v.string(),
    customerInitials: v.string(),
    service: v.string(),
    serviceType: v.string(),          // 'home' | 'deep' | 'move' | 'office'
    address: v.string(),
    area: v.string(),
    proposedDate: v.string(),         // ISO
    durationHours: v.number(),
    proposedRateKr: v.number(),
    message: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_cleaner', ['cleanerSlug'])
    .index('by_cleaner_status', ['cleanerSlug', 'status']),

  cleanerAvailability: defineTable({
    cleanerSlug: v.string(),
    weekStart: v.string(),            // ISO YYYY-MM-DD of Monday
    slots: v.array(v.string()),       // ['Mon|09:00', 'Tue|14:00', …]
  }).index('by_cleaner_week', ['cleanerSlug', 'weekStart']),

  cleanerJobs: defineTable({
    cleanerSlug: v.string(),
    customerName: v.string(),
    customerInitials: v.string(),
    address: v.string(),
    area: v.string(),
    service: v.string(),
    serviceType: v.string(),
    startsAt: v.string(),             // ISO
    durationHours: v.number(),
    status: v.string(),               // 'completed' | 'in_progress' | 'upcoming'
    hourlyRateKr: v.number(),
    totalKr: v.number(),
    floor: v.optional(v.string()),
    accessCode: v.optional(v.string()),
    notes: v.optional(v.string()),
    checklist: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        room: v.string(),
        done: v.boolean(),
      }),
    ),
    completedAt: v.optional(v.number()),
  })
    .index('by_cleaner', ['cleanerSlug'])
    .index('by_cleaner_status', ['cleanerSlug', 'status']),

  cleanerPayouts: defineTable({
    cleanerSlug: v.string(),
    paidAt: v.string(),               // ISO
    kr: v.number(),
    status: v.string(),               // 'paid' | 'pending'
  }).index('by_cleaner', ['cleanerSlug']),

  // Live status / availability heartbeat per cleaner.
  // One row per cleaner; upserted on every status change + heartbeat.
  cleanerStatus: defineTable({
    cleanerSlug: v.string(),
    // 'available' | 'en_route' | 'working' | 'available_in' | 'offline'
    status: v.string(),
    lastSeenAt: v.number(),           // last heartbeat
    etaMinutes: v.optional(v.number()),       // when en_route
    currentBookingId: v.optional(v.id('bookings')),
    availableInHours: v.optional(v.number()), // when available_in
  })
    .index('by_cleaner', ['cleanerSlug'])
    .index('by_status', ['status'])
    .index('by_status_lastSeen', ['status', 'lastSeenAt']),
});
