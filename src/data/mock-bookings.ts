export type BookingStatus = 'in_progress' | 'confirmed' | 'upcoming' | 'completed' | 'cancelled';
export type ServiceType = 'home' | 'deep' | 'move' | 'office';

export interface AddOn {
  id: string;
  label: string;
  priceKr: number;
}

export interface PaymentMethod {
  brand: 'visa' | 'mastercard' | 'vipps';
  last4: string;
}

export type ImageSrc = string | number;

export interface Booking {
  id: string;
  service: string;
  serviceType: ServiceType;
  imageUrl: ImageSrc;
  startsAt: string;
  endsAt: string;
  address: string;
  status: BookingStatus;
  orderNumber: string;
  cleaner: {
    id: string;
    name: string;
    avatarUrl: ImageSrc;
    etaMinutes?: number;
  };
  addOns: AddOn[];
  payment: PaymentMethod;
  totalKr: number;
  recurring?: 'weekly' | 'biweekly' | 'monthly';
}

const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const inOneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

export const mockBookings: Booking[] = [
  {
    id: 'bk_12345',
    service: 'Hjemvask',
    serviceType: 'home',
    imageUrl: require('@/assets/images/mock/thumb-booking-1.jpg'),
    startsAt: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
    endsAt: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
    address: '123 Grünerløkka, Oslo',
    status: 'in_progress',
    orderNumber: '12345',
    cleaner: {
      id: 'cl_maria',
      name: 'Maria Johansen',
      avatarUrl: require('@/assets/images/mock/cleaner-nina-avatar.jpg'),
      etaMinutes: 12,
    },
    addOns: [{ id: 'a_fridge', label: 'Inside fridge', priceKr: 200 }],
    payment: { brand: 'visa', last4: '4242' },
    totalKr: 1250,
  },
  {
    id: 'bk_67890',
    service: 'Dypvask',
    serviceType: 'deep',
    imageUrl: require('@/assets/images/mock/thumb-booking-2.jpg'),
    startsAt: new Date(inOneWeek.setHours(9, 0, 0, 0)).toISOString(),
    endsAt: new Date(inOneWeek.setHours(12, 0, 0, 0)).toISOString(),
    address: 'St. Hanshaugen, Oslo',
    status: 'upcoming',
    orderNumber: '12346',
    cleaner: {
      id: 'cl_anna',
      name: 'Anna Berg',
      avatarUrl: require('@/assets/images/mock/cleaner-maja-avatar.jpg'),
    },
    addOns: [],
    payment: { brand: 'vipps', last4: '·' },
    totalKr: 1800,
  },
  {
    id: 'bk_24680',
    service: 'Hjemvask',
    serviceType: 'home',
    imageUrl: require('@/assets/images/mock/thumb-booking-3.jpg'),
    startsAt: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
    endsAt: new Date(tomorrow.setHours(12, 0, 0, 0)).toISOString(),
    address: 'Grünerløkka, Oslo',
    status: 'confirmed',
    orderNumber: '12347',
    cleaner: {
      id: 'cl_lina',
      name: 'Lina Strøm',
      avatarUrl: require('@/assets/images/mock/review-av-3.jpg'),
    },
    addOns: [],
    payment: { brand: 'visa', last4: '4242' },
    totalKr: 1100,
    recurring: 'weekly',
  },
  {
    id: 'bk_99999',
    service: 'Hjemvask',
    serviceType: 'home',
    imageUrl: require('@/assets/images/mock/thumb-booking-4.jpg'),
    startsAt: new Date(lastWeek.setHours(13, 0, 0, 0)).toISOString(),
    endsAt: new Date(lastWeek.setHours(15, 0, 0, 0)).toISOString(),
    address: 'Frogner, Oslo',
    status: 'completed',
    orderNumber: '12340',
    cleaner: {
      id: 'cl_maria',
      name: 'Maria Johansen',
      avatarUrl: require('@/assets/images/mock/cleaner-nina-avatar.jpg'),
    },
    addOns: [],
    payment: { brand: 'visa', last4: '4242' },
    totalKr: 1100,
  },
];

export function getBookingById(id: string): Booking | undefined {
  return mockBookings.find((b) => b.id === id);
}

export function getUpcomingBookings(): Booking[] {
  return mockBookings.filter((b) =>
    ['in_progress', 'confirmed', 'upcoming'].includes(b.status),
  );
}

export function getPastBookings(): Booking[] {
  return mockBookings.filter((b) => ['completed', 'cancelled'].includes(b.status));
}

export function getNextUpcomingBooking(): Booking | undefined {
  return getUpcomingBookings()
    .filter((b) => new Date(b.startsAt) > new Date())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
}

export function getCleanerOnTheWay(): Booking | undefined {
  return mockBookings.find((b) => b.status === 'in_progress' && b.cleaner.etaMinutes);
}
