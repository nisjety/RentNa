/**
 * Adapters: map Convex database documents to the types expected by UI components.
 * Injects local image assets (require() paths) since those can't live in Convex.
 */

import type { Booking, BookingStatus, ServiceType } from './mock-bookings';
import type { Cleaner, CleanerService, CleanerTag } from './mock-cleaners';
import { bookingImage, cleanerAvatar, cleanerHero, reviewAvatar } from './asset-map';

// ─── Convex document shapes (must match convex/schema.ts) ─────────────────────

export type ConvexCleaner = {
  _id: string;
  _creationTime: number;
  slug: string;
  name: string;
  shortName: string;
  initials: string;
  area: string;
  city: string;
  yearsExperience: number;
  hourlyRateKr: number;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  isSuperCleaner: boolean;
  isVerified: boolean;
  bio: string;
  tags: string[];
  services: string[];
  agencyIds: string[];
  reviews?: Array<{
    _id: string;
    _creationTime: number;
    authorName: string;
    authorAvatarKey?: string;
    rating: number;
    text: string;
    createdAt: number;
  }>;
};

export type ConvexBooking = {
  _id: string;
  _creationTime: number;
  userId: string;
  cleanerSlug: string;
  cleanerName: string;
  service: string;
  serviceType: string;
  startsAt: string;
  endsAt: string;
  address: string;
  status: string;
  orderNumber: string;
  totalKr: number;
  recurring?: string;
  addOns: Array<{ id: string; label: string; priceKr: number }>;
  paymentBrand: string;
  paymentLast4: string;
  etaMinutes?: number;
};

export type ConvexThread = {
  _id: string;
  _creationTime: number;
  userId: string;
  cleanerSlug: string;
  cleanerShortName: string;
  cleanerInitials: string;
  preview: string;
  unread: boolean;
  highlighted: boolean;
  badge?: string;
  lastMessageAt: number;
};

// ─── Adapter functions ────────────────────────────────────────────────────────

export function adaptCleaner(doc: ConvexCleaner): Cleaner {
  return {
    id: doc.slug,
    name: doc.name,
    shortName: doc.shortName,
    initials: doc.initials,
    avatarUrl: cleanerAvatar(doc.slug),
    heroImageUrl: cleanerHero(doc.slug),
    area: doc.area,
    city: doc.city,
    yearsExperience: doc.yearsExperience,
    hourlyRateKr: doc.hourlyRateKr,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    jobsCompleted: doc.jobsCompleted,
    isSuperCleaner: doc.isSuperCleaner,
    isVerified: doc.isVerified,
    bio: doc.bio,
    tags: doc.tags as CleanerTag[],
    services: doc.services as CleanerService[],
    nextAvailable: { startsAt: new Date().toISOString(), label: 'Snart tilgjengelig' },
    upcomingSlots: [],
    reviews: (doc.reviews ?? []).map((r) => ({
      id: r._id,
      authorName: r.authorName,
      authorAvatarUrl: reviewAvatar(r.authorAvatarKey),
      rating: r.rating,
      text: r.text,
      date: new Date(r.createdAt).toISOString(),
    })),
    agencyIds: doc.agencyIds,
  };
}

export function adaptBooking(doc: ConvexBooking): Booking {
  return {
    id: doc._id,
    service: doc.service,
    serviceType: doc.serviceType as ServiceType,
    imageUrl: bookingImage(doc.serviceType),
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    address: doc.address,
    status: doc.status as BookingStatus,
    orderNumber: doc.orderNumber,
    cleaner: {
      id: doc.cleanerSlug,
      name: doc.cleanerName,
      avatarUrl: cleanerAvatar(doc.cleanerSlug),
      etaMinutes: doc.etaMinutes,
    },
    addOns: doc.addOns,
    payment: {
      brand: doc.paymentBrand as 'visa' | 'mastercard' | 'vipps',
      last4: doc.paymentLast4,
    },
    totalKr: doc.totalKr,
    recurring: doc.recurring as Booking['recurring'],
  };
}
