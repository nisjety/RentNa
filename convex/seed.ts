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

// ─── Agency demo data ────────────────────────────────────────────────────────

/**
 * Seeds the calling user's agency workspace with sample members, requests
 * and shifts so the agency UI has data to display.
 *
 * Idempotent: skips work if the agency already has members.
 */
export const seedAgencyWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 'unauthenticated';

    let agency = await ctx.db
      .query('agencies')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', identity.subject))
      .first();

    if (!agency) {
      const agencyId = await ctx.db.insert('agencies', {
        ownerUserId: identity.subject,
        name: 'Oslo Renhold AS',
        orgNumber: undefined,
        city: 'Oslo',
        createdAt: Date.now(),
      });
      agency = await ctx.db.get(agencyId);
      if (!agency) throw new Error('Kunne ikke opprette byrå');
    }

    const existingMembers = await ctx.db
      .query('agencyMembers')
      .withIndex('by_agency', (q) => q.eq('agencyId', agency!._id))
      .first();
    if (existingMembers) return 'already_seeded';

    // Members (roster)
    const members = [
      { cleanerSlug: 'cl_maja',       name: 'Maja L.',       initials: 'ML', tone: '#D6CCBA', area: 'Grünerløkka',  status: 'on_job',    hoursToday: 7, hoursWeek: 28, fasteCount: 12 },
      { cleanerSlug: 'cl_oleksandra', name: 'Oleksandra K.', initials: 'OK', tone: '#C8D8E2', area: 'Frogner',       status: 'available', hoursToday: 4, hoursWeek: 18, fasteCount: 6  },
      { cleanerSlug: 'cl_amir',       name: 'Amir T.',       initials: 'AT', tone: '#D9D6CC', area: 'Sagene',        status: 'on_job',    hoursToday: 6, hoursWeek: 24, fasteCount: 9  },
      { cleanerSlug: 'cl_liv',        name: 'Liv M.',        initials: 'LM', tone: '#E2D8CC', area: 'St. Hanshaugen',status: 'off',       hoursToday: 0, hoursWeek: 12, fasteCount: 3  },
      { cleanerSlug: 'cl_nina',       name: 'Nina S.',       initials: 'NS', tone: '#CCD4D8', area: 'Tøyen',         status: 'available', hoursToday: 5, hoursWeek: 22, fasteCount: 8  },
    ];

    for (const m of members) {
      await ctx.db.insert('agencyMembers', {
        agencyId: agency._id,
        ...m,
        joinedAt: Date.now(),
      });
    }

    // Requests (sample dispatch queue)
    const inDays = (n: number) =>
      new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

    const requests = [
      {
        orderNum: '2841',
        clientName: 'Lillian B.',
        area: 'Bygdøy',
        address: 'Bygdøy allé 41',
        service: 'Hjemvask',
        recurring: 'ukentlig',
        valueKr: 4560,
        valuePeriod: 'mnd',
        startsAt: inDays(3),
        endsAt: inDays(3),
        priority: 'HØY',
        status: 'new',
        assignedCleanerSlug: undefined,
        autoMatchCleanerSlug: 'cl_maja',
        autoMatchScore: 97,
      },
      {
        orderNum: '2842',
        clientName: 'Aisha N.',
        area: 'Tøyen',
        address: 'Tøyengata 22',
        service: 'Dypvask',
        recurring: '1 gang',
        valueKr: 1680,
        valuePeriod: 'gang',
        startsAt: inDays(5),
        endsAt: inDays(5),
        priority: 'MEDIUM',
        status: 'new',
        assignedCleanerSlug: undefined,
        autoMatchCleanerSlug: 'cl_amir',
        autoMatchScore: 97,
      },
      {
        orderNum: '2840',
        clientName: 'Henrik S.',
        area: 'Frogner',
        address: 'Bygdøy allé 12',
        service: 'Hjemvask',
        recurring: 'annenhver',
        valueKr: 2280,
        valuePeriod: 'mnd',
        startsAt: inDays(-2),
        endsAt: inDays(-2),
        priority: 'LAV',
        status: 'confirmed',
        assignedCleanerSlug: 'cl_oleksandra',
        autoMatchCleanerSlug: 'cl_oleksandra',
        autoMatchScore: 95,
      },
    ];

    for (const r of requests) {
      await ctx.db.insert('requests', {
        agencyId: agency._id,
        ...r,
        createdAt: Date.now(),
      });
    }

    // Shifts (current week)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(monday.getDate() + mondayOffset);
    const weekStart = monday.toISOString().slice(0, 10);

    const shifts = [
      // Maja
      { cleanerSlug: 'cl_maja', dayIndex: 0, startHour: 8,  endHour: 12, kind: 'booking', label: 'Lillian B.' },
      { cleanerSlug: 'cl_maja', dayIndex: 1, startHour: 8,  endHour: 12, kind: 'booking', label: 'Lillian B.' },
      { cleanerSlug: 'cl_maja', dayIndex: 2, startHour: 13, endHour: 17, kind: 'shift',   label: undefined },
      { cleanerSlug: 'cl_maja', dayIndex: 3, startHour: 8,  endHour: 16, kind: 'booking', label: 'Erik H.' },
      // Oleksandra
      { cleanerSlug: 'cl_oleksandra', dayIndex: 0, startHour: 9,  endHour: 13, kind: 'shift',   label: undefined },
      { cleanerSlug: 'cl_oleksandra', dayIndex: 2, startHour: 9,  endHour: 14, kind: 'booking', label: 'Aisha N.' },
      { cleanerSlug: 'cl_oleksandra', dayIndex: 4, startHour: 10, endHour: 14, kind: 'shift',   label: undefined },
      // Amir
      { cleanerSlug: 'cl_amir', dayIndex: 0, startHour: 10, endHour: 14, kind: 'booking', label: 'Tom B.' },
      { cleanerSlug: 'cl_amir', dayIndex: 1, startHour: 9,  endHour: 15, kind: 'booking', label: 'Office A' },
      { cleanerSlug: 'cl_amir', dayIndex: 2, startHour: 9,  endHour: 15, kind: 'booking', label: 'Office A' },
      { cleanerSlug: 'cl_amir', dayIndex: 3, startHour: 9,  endHour: 12, kind: 'shift',   label: undefined },
      // Liv (mostly off)
      { cleanerSlug: 'cl_liv', dayIndex: 4, startHour: 12, endHour: 16, kind: 'booking', label: 'Ida W.' },
      // Nina
      { cleanerSlug: 'cl_nina', dayIndex: 1, startHour: 11, endHour: 15, kind: 'booking', label: 'Per Å.' },
      { cleanerSlug: 'cl_nina', dayIndex: 3, startHour: 8,  endHour: 12, kind: 'shift',   label: undefined },
      { cleanerSlug: 'cl_nina', dayIndex: 4, startHour: 8,  endHour: 12, kind: 'booking', label: 'Marit T.' },
    ];

    for (const s of shifts) {
      await ctx.db.insert('shifts', {
        agencyId: agency._id,
        weekStart,
        ...s,
      });
    }

    return 'seeded';
  },
});

// ─── Cleaner-pro demo data ───────────────────────────────────────────────────

/**
 * Seeds the calling user's cleaner-pro workspace.
 * - Creates a cleanerProfile linking user ↔ cl_maja
 * - Adds sample jobs (3) for today
 * - Adds sample incoming requests (3)
 * - Adds Mon–Fri availability for current week
 * - Adds recent payouts
 * - Backfills 4 historical completed jobs to make earnings charts non-empty
 */
export const seedCleanerWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 'unauthenticated';

    // Ensure profile
    let profile = await ctx.db
      .query('cleanerProfiles')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first();
    if (!profile) {
      const id = await ctx.db.insert('cleanerProfiles', {
        userId: identity.subject,
        cleanerSlug: 'cl_maja',
        payoutMethod: 'vipps',
        payoutLast4: '4567',
        createdAt: Date.now(),
      });
      profile = await ctx.db.get(id);
      if (!profile) throw new Error('Profile creation failed');
    }
    const slug = profile.cleanerSlug;

    // Idempotency: skip if jobs already seeded for this cleaner
    const anyJob = await ctx.db
      .query('cleanerJobs')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .first();
    if (anyJob) return 'already_seeded';

    const at = (h: number, m = 0) => {
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };
    const daysFromNow = (n: number, h = 10) => {
      const d = new Date(Date.now() + n * 86400000);
      d.setHours(h, 0, 0, 0);
      return d.toISOString();
    };

    // Today's jobs
    await ctx.db.insert('cleanerJobs', {
      cleanerSlug: slug,
      customerName: 'Emma Larsen',
      customerInitials: 'EL',
      address: 'Thorvald Meyers gate 14',
      area: 'Grünerløkka',
      service: 'Hjemvask',
      serviceType: 'home',
      startsAt: at(9, 0),
      durationHours: 2,
      status: 'completed',
      hourlyRateKr: 380,
      totalKr: 760,
      checklist: [],
      completedAt: Date.now() - 3 * 3600000,
    });

    await ctx.db.insert('cleanerJobs', {
      cleanerSlug: slug,
      customerName: 'Henrik Stavnes',
      customerInitials: 'HS',
      address: 'Bogstadveien 52',
      area: 'St. Hanshaugen',
      service: 'Hjemvask',
      serviceType: 'home',
      startsAt: at(11, 30),
      durationHours: 2.5,
      status: 'in_progress',
      hourlyRateKr: 380,
      totalKr: 950,
      floor: '3. etg',
      accessCode: '#4812',
      notes: 'Hunden heter Max — rolig og vennlig.',
      checklist: [
        { id: 'c1', label: 'Støvsug stue',         room: 'Stue',     done: true  },
        { id: 'c2', label: 'Vask gulv stue',        room: 'Stue',     done: true  },
        { id: 'c3', label: 'Støvsug soverom',       room: 'Soverom',  done: false },
        { id: 'c4', label: 'Skrubb baderom',        room: 'Bad',      done: false },
        { id: 'c5', label: 'Tørk kjøkkenflater',    room: 'Kjøkken',  done: false },
        { id: 'c6', label: 'Ta søppel',             room: 'Kjøkken',  done: false },
      ],
    });

    await ctx.db.insert('cleanerJobs', {
      cleanerSlug: slug,
      customerName: 'Ida Berg',
      customerInitials: 'IB',
      address: 'Maridalsveien 17',
      area: 'Sagene',
      service: 'Dypvask',
      serviceType: 'deep',
      startsAt: at(14, 30),
      durationHours: 3,
      status: 'upcoming',
      hourlyRateKr: 380,
      totalKr: 1140,
      checklist: [],
    });

    // Historical completed jobs for earnings chart
    const histPrices = [800, 1200, 950, 1100];
    for (let i = 0; i < histPrices.length; i++) {
      const completedAt = Date.now() - (i + 1) * 30 * 86400000;
      await ctx.db.insert('cleanerJobs', {
        cleanerSlug: slug,
        customerName: 'Tidligere kunde',
        customerInitials: 'TK',
        address: 'Oslo',
        area: 'Oslo',
        service: 'Hjemvask',
        serviceType: 'home',
        startsAt: new Date(completedAt).toISOString(),
        durationHours: 2.5,
        status: 'completed',
        hourlyRateKr: 380,
        totalKr: histPrices[i],
        checklist: [],
        completedAt,
      });
    }

    // Incoming requests
    await ctx.db.insert('jobRequests', {
      cleanerSlug: slug,
      status: 'pending',
      customerName: 'Lars Kristiansen',
      customerInitials: 'LK',
      service: 'Hjemvask',
      serviceType: 'home',
      address: 'Frognerveien 23',
      area: 'Frogner',
      proposedDate: daysFromNow(2),
      durationHours: 2,
      proposedRateKr: 380,
      message: 'Har en labrador. Er hunder ok?',
      createdAt: Date.now() - 2 * 3600000,
    });

    await ctx.db.insert('jobRequests', {
      cleanerSlug: slug,
      status: 'pending',
      customerName: 'Marte Holt',
      customerInitials: 'MH',
      service: 'Dypvask',
      serviceType: 'deep',
      address: 'Pilestredet 45',
      area: 'St. Hanshaugen',
      proposedDate: daysFromNow(4),
      durationHours: 4,
      proposedRateKr: 380,
      message: 'Tre-roms, 80 kvm. Trenger grundig vask av kjøkken og bad.',
      createdAt: Date.now() - 6 * 3600000,
    });

    await ctx.db.insert('jobRequests', {
      cleanerSlug: slug,
      status: 'pending',
      customerName: 'Ole Strand',
      customerInitials: 'OS',
      service: 'Kontorrenhold',
      serviceType: 'office',
      address: 'Karl Johans gate 7',
      area: 'Sentrum',
      proposedDate: daysFromNow(5),
      durationHours: 3,
      proposedRateKr: 420,
      createdAt: Date.now() - 12 * 3600000,
    });

    // Availability — Mon–Fri 09:00–16:00 for current week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(today);
    monday.setDate(monday.getDate() + mondayOffset);
    const weekStartISO = monday.toISOString().slice(0, 10);
    const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const SLOT_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    const slots: string[] = [];
    DAY_KEYS.forEach((day, dIdx) => {
      const slotDate = new Date(monday);
      slotDate.setDate(monday.getDate() + dIdx);
      const slotDay = slotDate.toDateString();
      SLOT_TIMES.forEach((t) => slots.push(`${slotDay}|${t}`));
    });
    await ctx.db.insert('cleanerAvailability', {
      cleanerSlug: slug,
      weekStart: weekStartISO,
      slots,
    });

    // Payouts
    const payouts = [
      { kr: 3800, daysAgo: 3,  status: 'paid' },
      { kr: 4100, daysAgo: 10, status: 'paid' },
      { kr: 3760, daysAgo: 17, status: 'paid' },
    ];
    for (const p of payouts) {
      await ctx.db.insert('cleanerPayouts', {
        cleanerSlug: slug,
        paidAt: new Date(Date.now() - p.daysAgo * 86400000).toISOString(),
        kr: p.kr,
        status: p.status,
      });
    }

    return 'seeded';
  },
});
