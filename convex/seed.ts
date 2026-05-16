import { mutation } from './_generated/server';

// Call once from the app (or Convex dashboard) to populate demo cleaners.
// Idempotent: skips if cleaners already exist.
export const seedCleaners = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('cleaners').first();
    if (existing) return 'already_seeded';

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const thursday = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

    const cleaners = [
      {
        slug: 'cl_maja',
        name: 'Maja Lovisa',
        shortName: 'Maja L.',
        initials: 'ML',
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
        agencyIds: [] as string[],
        _nextAvailable: tomorrow,
      },
      {
        slug: 'cl_amir',
        name: 'Amir Tahir',
        shortName: 'Amir T.',
        initials: 'AT',
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
        agencyIds: ['ag_rentcrew'],
        _nextAvailable: tomorrow,
      },
      {
        slug: 'cl_liv',
        name: 'Liv Marie',
        shortName: 'Liv M.',
        initials: 'LM',
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
        agencyIds: [] as string[],
        _nextAvailable: thursday,
      },
      {
        slug: 'cl_nina',
        name: 'Nina Strøm',
        shortName: 'Nina S.',
        initials: 'NS',
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
        agencyIds: ['ag_rentcrew'],
        _nextAvailable: tomorrow,
      },
    ];

    for (const { _nextAvailable: _, ...cleaner } of cleaners) {
      await ctx.db.insert('cleaners', cleaner);
    }

    // Seed reviews for each cleaner
    const reviewAuthors = [
      { name: 'Emma L.', key: 'av1' },
      { name: 'Henrik S.', key: 'av2' },
      { name: 'Ida B.', key: 'av3' },
    ];

    const reviewTexts = [
      'Fantastisk! Leiligheten har aldri vært renere.',
      'Punktlig, vennlig og veldig grundig. Anbefales på det sterkeste.',
      'Bruker miljøvennlige produkter og har et godt øye for detaljer.',
    ];

    const ratings = [5.0, 5.0, 4.8];

    for (const cleaner of cleaners) {
      for (let i = 0; i < reviewAuthors.length; i++) {
        await ctx.db.insert('reviews', {
          cleanerSlug: cleaner.slug,
          authorName: reviewAuthors[i].name,
          authorAvatarKey: reviewAuthors[i].key,
          rating: ratings[i],
          text: reviewTexts[i],
          createdAt: Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000,
        });
      }
    }

    return 'seeded';
  },
});
