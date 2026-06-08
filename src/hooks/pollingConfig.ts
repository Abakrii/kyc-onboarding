// Polling cadence for the status-review loop. Kept in its own module so tests can
// jest.mock() it to shrink the interval (and run the full flow fast).

// Delay between status polls while an application is `submitted`.
export const POLL_INTERVAL_MS = 1500;

// Hard cap on poll attempts before the controller gives up (a safety bound; the
// fake service resolves well within this).
export const MAX_POLLS = 12;
