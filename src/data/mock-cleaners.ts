export type CleanerTag = 'eco' | 'norwegian' | 'pets_ok' | 'english' | 'verified_id';
export type CleanerService = 'regular' | 'deep' | 'move' | 'office' | 'windows';

export interface CleanerSlot {
  startsAt: string;
  label: string;
}

export type ImageSrc = string | number;

export interface CleanerReview {
  id: string;
  authorName: string;
  authorAvatarUrl?: ImageSrc;
  rating: number;
  text: string;
  date: string;
}

export interface Cleaner {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  avatarUrl?: ImageSrc;
  heroImageUrl?: ImageSrc;
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
  tags: CleanerTag[];
  services: CleanerService[];
  nextAvailable: CleanerSlot;
  upcomingSlots: CleanerSlot[];
  reviews: CleanerReview[];
  agencyIds: string[];
}

export const SERVICE_LABEL: Record<CleanerService, string> = {
  regular: 'Vanlig renhold',
  deep: 'Dypvask',
  move: 'Flyttevask',
  office: 'Kontorvask',
  windows: 'Vindusvask',
};

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const thursday = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

function slot(date: Date, h: number, m: number): CleanerSlot {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return {
    startsAt: d.toISOString(),
    label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
  };
}

function reviewsFor(prefix: string): CleanerReview[] {
  return [
    {
      id: `${prefix}_r1`,
      authorName: 'Emma L.',
      authorAvatarUrl: require('@/assets/images/mock/review-av-1.jpg'),
      rating: 5.0,
      text: 'Maja er fantastisk! Leiligheten har aldri vært renere.',
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${prefix}_r2`,
      authorName: 'Henrik S.',
      authorAvatarUrl: require('@/assets/images/mock/review-av-2.jpg'),
      rating: 5.0,
      text: 'Punktlig, vennlig og veldig grundig. Anbefales på det sterkeste.',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${prefix}_r3`,
      authorName: 'Ida B.',
      authorAvatarUrl: require('@/assets/images/mock/review-av-3.jpg'),
      rating: 4.8,
      text: 'Bruker miljøvennlige produkter og har et godt øye for detaljer.',
      date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export const mockCleaners: Cleaner[] = [
  {
    id: 'cl_maja',
    name: 'Maja Lovisa',
    shortName: 'Maja L.',
    initials: 'ML',
    avatarUrl: require('@/assets/images/mock/cleaner-maja-avatar.jpg'),
    heroImageUrl: require('@/assets/images/mock/hero-maja.jpg'),
    area: 'Grünerløkka',
    city: 'Oslo',
    yearsExperience: 5,
    hourlyRateKr: 380,
    rating: 4.97,
    reviewCount: 312,
    jobsCompleted: 192,
    isSuperCleaner: true,
    isVerified: true,
    bio: 'Detaljorientert og pålitelig renholder med en lidenskap for å skape vakre, komfortable hjem. Jeg er stolt av hvert rom jeg vasker.\n\nJeg bruker miljøvennlige produkter og passer på de små detaljene.',
    tags: ['eco', 'norwegian', 'pets_ok'],
    services: ['regular', 'deep', 'move', 'office'],
    nextAvailable: { ...slot(tomorrow, 9, 0), label: 'I morgen · 09:00' },
    upcomingSlots: [slot(tomorrow, 9, 0), slot(tomorrow, 11, 0), slot(tomorrow, 13, 30), slot(tomorrow, 15, 0)],
    reviews: reviewsFor('cl_maja'),
    agencyIds: [],
  },
  {
    id: 'cl_amir',
    name: 'Amir Tahir',
    shortName: 'Amir T.',
    initials: 'AT',
    avatarUrl: require('@/assets/images/mock/cleaner-amir-avatar.jpg'),
    heroImageUrl: require('@/assets/images/mock/hero-amir.jpg'),
    area: 'Sagene',
    city: 'Oslo',
    yearsExperience: 8,
    hourlyRateKr: 350,
    rating: 4.89,
    reviewCount: 421,
    jobsCompleted: 421,
    isSuperCleaner: false,
    isVerified: true,
    bio: 'Pålitelig og grundig — møter alltid med smil og raskere enn forventet. 8 års erfaring fra både private hjem og kontorlokaler.',
    tags: ['norwegian', 'english'],
    services: ['regular', 'deep', 'office', 'windows'],
    nextAvailable: { ...slot(tomorrow, 13, 0), label: 'I morgen · 13:00' },
    upcomingSlots: [slot(tomorrow, 13, 0), slot(tomorrow, 15, 0)],
    reviews: reviewsFor('cl_amir'),
    agencyIds: ['ag_rentcrew'],
  },
  {
    id: 'cl_liv',
    name: 'Liv Marie',
    shortName: 'Liv M.',
    initials: 'LM',
    avatarUrl: require('@/assets/images/mock/cleaner-liv-avatar.jpg'),
    heroImageUrl: require('@/assets/images/mock/hero-liv.jpg'),
    area: 'St. Hanshaugen',
    city: 'Oslo',
    yearsExperience: 2,
    hourlyRateKr: 410,
    rating: 4.99,
    reviewCount: 89,
    jobsCompleted: 89,
    isSuperCleaner: false,
    isVerified: true,
    bio: 'Ny på plattformen, men har lang erfaring fra hotelldrift. Detaljorientert og presis.',
    tags: ['eco', 'norwegian'],
    services: ['regular', 'deep', 'move'],
    nextAvailable: { ...slot(thursday, 11, 0), label: 'Torsdag · 11:00' },
    upcomingSlots: [slot(thursday, 11, 0), slot(thursday, 14, 0)],
    reviews: reviewsFor('cl_liv'),
    agencyIds: [],
  },
  {
    id: 'cl_nina',
    name: 'Nina Strøm',
    shortName: 'Nina S.',
    initials: 'NS',
    avatarUrl: require('@/assets/images/mock/cleaner-nina-avatar.jpg'),
    heroImageUrl: require('@/assets/images/mock/hero-nina.jpg'),
    area: 'Tøyen',
    city: 'Oslo',
    yearsExperience: 5,
    hourlyRateKr: 360,
    rating: 4.92,
    reviewCount: 254,
    jobsCompleted: 254,
    isSuperCleaner: true,
    isVerified: true,
    bio: 'Fast renholder for små familier. Tilgjengelig morgener og ettermiddager. Husdyr ok.',
    tags: ['norwegian', 'pets_ok', 'verified_id'],
    services: ['regular', 'deep', 'office', 'windows'],
    nextAvailable: { ...slot(tomorrow, 15, 30), label: 'I morgen · 15:30' },
    upcomingSlots: [slot(tomorrow, 15, 30), slot(thursday, 9, 0)],
    reviews: reviewsFor('cl_nina'),
    agencyIds: ['ag_rentcrew'],
  },
];

export const TAG_LABEL: Record<CleanerTag, string> = {
  eco: 'Miljøvennlig',
  norwegian: 'Snakker norsk',
  pets_ok: 'Husdyr OK',
  english: 'Speaks English',
  verified_id: 'ID-verifisert',
};

export function getCleanerById(id: string): Cleaner | undefined {
  return mockCleaners.find((c) => c.id === id);
}

export function getCleaners(): Cleaner[] {
  return mockCleaners;
}
