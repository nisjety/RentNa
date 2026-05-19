'use node';

import { v } from 'convex/values';

import { internal } from './_generated/api';
import { action, internalAction } from './_generated/server';

/**
 * Vipps ePayment API client — sandbox by default.
 *
 * Required Convex env vars (set via `npx convex env set …`):
 *   VIPPS_CLIENT_ID
 *   VIPPS_CLIENT_SECRET
 *   VIPPS_SUBSCRIPTION_KEY
 *   VIPPS_MERCHANT_SERIAL_NUMBER
 *   VIPPS_RETURN_URL   (e.g. https://your-app.dev/vipps-return)
 *   VIPPS_BASE_URL     (default https://apitest.vipps.no)
 *
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/epayment-api/
 */

const SYSTEM_HEADERS = {
  'Vipps-System-Name': 'rentna',
  'Vipps-System-Version': '0.1.0',
  'Vipps-System-Plugin-Name': 'rentna-convex',
  'Vipps-System-Plugin-Version': '0.1.0',
};

function baseUrl(): string {
  return process.env.VIPPS_BASE_URL ?? 'https://apitest.vipps.no';
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Mangler Convex env var ${name}. Sett den med: npx convex env set ${name} <verdi>`,
    );
  }
  return v;
}

interface AccessTokenResponse {
  token_type: string;
  expires_in: string;
  access_token: string;
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${baseUrl()}/accesstoken/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      client_id: requireEnv('VIPPS_CLIENT_ID'),
      client_secret: requireEnv('VIPPS_CLIENT_SECRET'),
      'Ocp-Apim-Subscription-Key': requireEnv('VIPPS_SUBSCRIPTION_KEY'),
      'Merchant-Serial-Number': requireEnv('VIPPS_MERCHANT_SERIAL_NUMBER'),
    },
    body: '',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vipps access-token failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as AccessTokenResponse;
  return json.access_token;
}

function vippsHeaders(accessToken: string, idempotencyKey?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'Ocp-Apim-Subscription-Key': requireEnv('VIPPS_SUBSCRIPTION_KEY'),
    'Merchant-Serial-Number': requireEnv('VIPPS_MERCHANT_SERIAL_NUMBER'),
    ...SYSTEM_HEADERS,
  };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  return headers;
}

function toMsisdn(input: string): string {
  // Strip non-digits, force NO country code if 8-digit local number.
  const digits = input.replace(/[^\d]/g, '');
  if (digits.startsWith('47') && digits.length === 10) return digits;
  if (digits.length === 8) return `47${digits}`;
  return digits;
}

// ─── Public action: initiate payment ─────────────────────────────────────────

export const initiatePayment = action({
  args: {
    bookingId: v.id('bookings'),
    phoneNumber: v.string(),
  },
  handler: async (ctx, { bookingId, phoneNumber }): Promise<{ redirectUrl: string; reference: string }> => {
    const booking = await ctx.runMutation(internal.bookings.internalGet, { bookingId });
    if (!booking) throw new Error('Booking ikke funnet');

    const accessToken = await getAccessToken();
    const reference = `rentna-${booking.orderNumber}-${Math.random().toString(36).slice(2, 8)}`;
    const returnUrl = process.env.VIPPS_RETURN_URL
      ?? `https://rentna.no/vipps-return?reference=${reference}`;

    const body = {
      amount: { currency: 'NOK', value: booking.totalKr * 100 }, // øre
      paymentMethod: { type: 'WALLET' },
      customer: { phoneNumber: toMsisdn(phoneNumber) },
      reference,
      returnUrl,
      userFlow: 'WEB_REDIRECT',
      paymentDescription: `${booking.service} hos ${booking.cleanerName}`,
    };

    const res = await fetch(`${baseUrl()}/epayment/v1/payments`, {
      method: 'POST',
      headers: vippsHeaders(accessToken, reference),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vipps initiate failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { reference: string; redirectUrl: string };

    await ctx.runMutation(internal.bookings.internalSetVippsRef, {
      bookingId,
      vippsReference: json.reference,
      vippsRedirectUrl: json.redirectUrl,
    });
    return { redirectUrl: json.redirectUrl, reference: json.reference };
  },
});

// ─── Sync status (poll after redirect) ───────────────────────────────────────

export const syncStatus = action({
  args: { bookingId: v.id('bookings') },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.runMutation(internal.bookings.internalGet, { bookingId });
    if (!booking?.vippsReference) return { state: 'NO_REFERENCE' };

    const accessToken = await getAccessToken();
    const res = await fetch(
      `${baseUrl()}/epayment/v1/payments/${booking.vippsReference}`,
      { method: 'GET', headers: vippsHeaders(accessToken) },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vipps status failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      state: string;
      aggregate?: {
        authorizedAmount?: { value: number };
        capturedAmount?: { value: number };
        refundedAmount?: { value: number };
        cancelledAmount?: { value: number };
      };
    };
    await ctx.runMutation(internal.bookings.internalApplyVippsState, {
      bookingId,
      state: json.state,
      aggregate: {
        authorizedAmount: json.aggregate?.authorizedAmount?.value,
        capturedAmount: json.aggregate?.capturedAmount?.value,
        refundedAmount: json.aggregate?.refundedAmount?.value,
        cancelledAmount: json.aggregate?.cancelledAmount?.value,
      },
    });
    return { state: json.state };
  },
});

// ─── Capture (cleaner-pro marks complete) ────────────────────────────────────

export const capture = internalAction({
  args: { bookingId: v.id('bookings'), amountKr: v.optional(v.number()) },
  handler: async (ctx, { bookingId, amountKr }) => {
    const booking = await ctx.runMutation(internal.bookings.internalGet, { bookingId });
    if (!booking?.vippsReference) throw new Error('Bookingen mangler Vipps-referanse');
    const valueOre = (amountKr ?? booking.totalKr) * 100;
    const accessToken = await getAccessToken();
    const idem = `${booking.vippsReference}-capture-${Date.now()}`;

    const res = await fetch(
      `${baseUrl()}/epayment/v1/payments/${booking.vippsReference}/capture`,
      {
        method: 'POST',
        headers: vippsHeaders(accessToken, idem),
        body: JSON.stringify({
          modificationAmount: { currency: 'NOK', value: valueOre },
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vipps capture failed (${res.status}): ${text.slice(0, 200)}`);
    }
    await ctx.runMutation(internal.bookings.internalApplyVippsState, {
      bookingId,
      state: 'CAPTURED',
      aggregate: undefined,
    });
    return { ok: true };
  },
});

// ─── Refund (cancellation flow) ──────────────────────────────────────────────

export const refund = internalAction({
  args: { bookingId: v.id('bookings'), amountKr: v.number() },
  handler: async (ctx, { bookingId, amountKr }) => {
    if (amountKr <= 0) return { ok: true, skipped: true };
    const booking = await ctx.runMutation(internal.bookings.internalGet, { bookingId });
    if (!booking?.vippsReference) throw new Error('Bookingen mangler Vipps-referanse');
    const valueOre = amountKr * 100;
    const accessToken = await getAccessToken();
    const idem = `${booking.vippsReference}-refund-${Date.now()}`;

    const res = await fetch(
      `${baseUrl()}/epayment/v1/payments/${booking.vippsReference}/refund`,
      {
        method: 'POST',
        headers: vippsHeaders(accessToken, idem),
        body: JSON.stringify({
          modificationAmount: { currency: 'NOK', value: valueOre },
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vipps refund failed (${res.status}): ${text.slice(0, 200)}`);
    }
    await ctx.runMutation(internal.bookings.internalApplyVippsState, {
      bookingId,
      state: 'REFUNDED',
      aggregate: undefined,
    });
    return { ok: true };
  },
});

// ─── Cancel (booking declined before capture) ────────────────────────────────

export const cancelPayment = internalAction({
  args: { bookingId: v.id('bookings') },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.runMutation(internal.bookings.internalGet, { bookingId });
    if (!booking?.vippsReference) return { ok: true, skipped: true };
    const accessToken = await getAccessToken();
    const idem = `${booking.vippsReference}-cancel-${Date.now()}`;

    const res = await fetch(
      `${baseUrl()}/epayment/v1/payments/${booking.vippsReference}/cancel`,
      {
        method: 'POST',
        headers: vippsHeaders(accessToken, idem),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vipps cancel failed (${res.status}): ${text.slice(0, 200)}`);
    }
    await ctx.runMutation(internal.bookings.internalApplyVippsState, {
      bookingId,
      state: 'ABORTED',
      aggregate: undefined,
    });
    return { ok: true };
  },
});
