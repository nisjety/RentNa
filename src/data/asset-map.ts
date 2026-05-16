/**
 * Maps Convex slugs / service-type keys to local static image assets.
 * require() paths are resolved at build time so they can't live in the database.
 */

export const CLEANER_AVATAR: Record<string, number> = {
  cl_maja: require('@/assets/images/mock/cleaner-maja-avatar.jpg'),
  cl_amir: require('@/assets/images/mock/cleaner-amir-avatar.jpg'),
  cl_liv: require('@/assets/images/mock/cleaner-liv-avatar.jpg'),
  cl_nina: require('@/assets/images/mock/cleaner-nina-avatar.jpg'),
};

export const CLEANER_HERO: Record<string, number> = {
  cl_maja: require('@/assets/images/mock/hero-maja.jpg'),
  cl_amir: require('@/assets/images/mock/hero-amir.jpg'),
  cl_liv: require('@/assets/images/mock/hero-liv.jpg'),
  cl_nina: require('@/assets/images/mock/hero-nina.jpg'),
};

export const REVIEW_AVATAR: Record<string, number> = {
  av1: require('@/assets/images/mock/review-av-1.jpg'),
  av2: require('@/assets/images/mock/review-av-2.jpg'),
  av3: require('@/assets/images/mock/review-av-3.jpg'),
};

export const BOOKING_IMAGE: Record<string, number> = {
  regular: require('@/assets/images/mock/thumb-booking-1.jpg'),
  home: require('@/assets/images/mock/thumb-booking-1.jpg'),
  deep: require('@/assets/images/mock/thumb-booking-2.jpg'),
  move: require('@/assets/images/mock/thumb-booking-3.jpg'),
  office: require('@/assets/images/mock/thumb-booking-4.jpg'),
  windows: require('@/assets/images/mock/thumb-booking-1.jpg'),
};

export function cleanerAvatar(slug: string): number {
  return CLEANER_AVATAR[slug] ?? CLEANER_AVATAR['cl_maja'];
}

export function cleanerHero(slug: string): number {
  return CLEANER_HERO[slug] ?? CLEANER_HERO['cl_maja'];
}

export function reviewAvatar(key?: string): number | undefined {
  if (!key) return undefined;
  return REVIEW_AVATAR[key];
}

export function bookingImage(serviceType: string): number {
  return BOOKING_IMAGE[serviceType] ?? BOOKING_IMAGE['home'];
}
