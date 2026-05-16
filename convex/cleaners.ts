import { v } from 'convex/values';

import { query } from './_generated/server';

export const list = query({
  args: {
    service: v.optional(v.string()),
    tag: v.optional(v.string()),
    area: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { service, tag, area, search }) => {
    let cleaners = await ctx.db.query('cleaners').collect();
    if (service) cleaners = cleaners.filter((c) => c.services.includes(service));
    if (tag) cleaners = cleaners.filter((c) => c.tags.includes(tag));
    if (area) cleaners = cleaners.filter((c) => c.area === area);
    if (search) {
      const q = search.toLowerCase();
      cleaners = cleaners.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.services.some((s) => s.toLowerCase().includes(q)),
      );
    }
    return cleaners;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const cleaner = await ctx.db
      .query('cleaners')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first();
    if (!cleaner) return null;
    const reviews = await ctx.db
      .query('reviews')
      .withIndex('by_cleaner', (q) => q.eq('cleanerSlug', slug))
      .collect();
    return { ...cleaner, reviews };
  },
});
