import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

/**
 * Auto-approve completed bookings that the customer hasn't touched in 12h.
 * Runs hourly; the mutation itself enforces the 12h cutoff.
 */
crons.interval(
  'Auto-approve stale bookings',
  { hours: 1 },
  internal.bookings.autoApproveExpired,
);

/**
 * Sweep cleaners that haven't sent a heartbeat in > 30 min and
 * flip them to 'offline'. Customers will see live availability
 * even if a cleaner closes the app without manually going offline.
 */
crons.interval(
  'Auto-offline inactive cleaners',
  { minutes: 5 },
  internal.cleanerStatus.sweepOffline,
);

export default crons;
