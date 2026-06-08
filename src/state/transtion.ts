// Transition table for the `remoteStatus` axis (KycStatus). Pure core: no I/O,
// no Date.now(), no randomness, no storage — given the same inputs it returns
// the same output. Every change to a KycApplication's status must be validated
// through `canTransition` so illegal jumps are unrepresentable and the state
// machine stays auditable.

import type { KycStatus } from '../types/kyc';

// Allowed forward transitions: `current -> the statuses it may move to`.
//
// Staying on the same status (e.g. submitted -> submitted) is an idempotent
// no-op handled by `canTransition` directly and is intentionally NOT listed
// here — this table only describes moves to a *different* status.
//
//   not_started -> draft -> submitted
//   submitted   -> approved | rejected | requires_more_info
//   requires_more_info -> submitted   (resubmit after fixing fields)
//   approved / rejected -> terminal   (no further transitions)
//
// Typed `Record<KycStatus, ...>` so a newly-added status fails to compile until
// its allowed transitions are declared here.
export const ALLOWED_TRANSTIONS: Record<KycStatus, readonly KycStatus[]> = {
  not_started: ['draft'],
  draft: ['submitted'],
  submitted: ['approved', 'rejected', 'requires_more_info'],
  requires_more_info: ['submitted'],
  approved: [],
  rejected: [],
};

// True when moving from `from` to `to` is permitted. Same -> same is always an
// idempotent no-op (allowed, including on terminal statuses); any other move is
// allowed only if it appears in ALLOWED_TRANSTIONS[from].
export const canTransition = (from: KycStatus, to: KycStatus): boolean =>
  from === to || ALLOWED_TRANSTIONS[from].includes(to);
