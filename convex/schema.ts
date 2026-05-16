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
  }).index('by_slug', ['slug']),

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
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status']),

  threads: defineTable({
    userId: v.string(),
    cleanerSlug: v.string(),
    preview: v.string(),
    unread: v.boolean(),
    highlighted: v.boolean(),
    badge: v.optional(v.string()),
    lastMessageAt: v.number(),
  }).index('by_user', ['userId']),

  messages: defineTable({
    threadId: v.id('threads'),
    senderId: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index('by_thread', ['threadId']),
});
