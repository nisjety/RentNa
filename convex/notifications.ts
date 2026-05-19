'use node';

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action, internalAction } from './_generated/server';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

async function sendMany(messages: ExpoMessage[]): Promise<void> {
  if (messages.length === 0) return;
  // Expo accepts batches of up to 100
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('Expo push failed', res.status, text.slice(0, 200));
    }
  }
}

/**
 * Internal: send a push notification to a Clerk user (all their tokens).
 * Wired via scheduler.runAfter from mutations (new message, ETA, etc.).
 */
export const pushToUser = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, { userId, title, body, data }) => {
    const tokens = await ctx.runQuery(internal.notificationsQueries.tokensByUser, { userId });
    await sendMany(
      tokens.map((t) => ({
        to: t.token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      })),
    );
  },
});

/** Internal: send to whichever device a cleaner has registered. */
export const pushToCleaner = internalAction({
  args: {
    cleanerSlug: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, { cleanerSlug, title, body, data }) => {
    const tokens = await ctx.runQuery(internal.notificationsQueries.tokensByCleaner, { cleanerSlug });
    await sendMany(
      tokens.map((t) => ({
        to: t.token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      })),
    );
  },
});

/** Public dev helper: send a test push to the current user. */
export const sendTestToMe = action({
  args: { title: v.optional(v.string()), body: v.optional(v.string()) },
  handler: async (ctx, { title, body }): Promise<{ delivered: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Ikke autentisert');
    const tokens: { token: string }[] = await ctx.runQuery(internal.notificationsQueries.tokensByUser, {
      userId: identity.subject,
    });
    await sendMany(
      tokens.map((t) => ({
        to: t.token,
        title: title ?? 'RentNå',
        body: body ?? 'Test-varsel fra appen',
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      })),
    );
    return { delivered: tokens.length };
  },
});
