/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agency from "../agency.js";
import type * as bookings from "../bookings.js";
import type * as cleanerPro from "../cleanerPro.js";
import type * as cleanerStatus from "../cleanerStatus.js";
import type * as cleaners from "../cleaners.js";
import type * as crons from "../crons.js";
import type * as notifications from "../notifications.js";
import type * as notificationsQueries from "../notificationsQueries.js";
import type * as seed from "../seed.js";
import type * as strikes from "../strikes.js";
import type * as threads from "../threads.js";
import type * as vipps from "../vipps.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agency: typeof agency;
  bookings: typeof bookings;
  cleanerPro: typeof cleanerPro;
  cleanerStatus: typeof cleanerStatus;
  cleaners: typeof cleaners;
  crons: typeof crons;
  notifications: typeof notifications;
  notificationsQueries: typeof notificationsQueries;
  seed: typeof seed;
  strikes: typeof strikes;
  threads: typeof threads;
  vipps: typeof vipps;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
