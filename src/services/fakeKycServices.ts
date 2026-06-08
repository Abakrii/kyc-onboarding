// Fake KYC backend. This is the side-effecting boundary of the app — it owns the
// `status` (remoteStatus) axis, simulates latency, and mirrors its state to
// AsyncStorage. It deliberately never logs application data (PII): names, dates
// of birth, addresses, and document numbers never reach a log sink.

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  isServiceOwned,
  STEP_REQUIRED_FIELDS,
  type KycApplication,
  type KycStep,
} from '../types/kyc';

// ── Public constants ────────────────────────────────────────────────────────

// Error codes thrown as `KycServiceError.code` so callers can branch without
// string-matching messages.
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONFLICT: 'CONFLICT',
} as const;

export type KycErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Magic document numbers that drive the fake's outcomes. Any other document
// number takes the happy path (approved after two polls).
export const TRIGGER_DOCUMENTS = {
  REJECT: 'REJECT',
  MORE_INFO: 'MOREINFO',
  NETWORK: 'NETWORK',
} as const;

export class KycServiceError extends Error {
  readonly code: KycErrorCode;

  constructor(code: KycErrorCode, message: string) {
    super(message);
    this.name = 'KycServiceError';
    this.code = code;
  }
}

// ── Tuning ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kyc:fake-server';
const DEFAULT_DELAY_MS = 350;
// Mutable so tests can shrink latency to run the full flow fast (see __setDelay).
let delayMs = DEFAULT_DELAY_MS;
const POLLS_UNTIL_RESOLUTION = 2;
const APPLICATION_ID = 'kyc-local-application';
const EPOCH = '1970-01-01T00:00:00.000Z';

// ── Module ("server") state ──────────────────────────────────────────────────

// The serializable server snapshot. `submitAttempts` powers the
// network-fails-once trigger; `pollCount` powers resolve-after-N-polls.
export interface ServerSnapshot {
  application: KycApplication;
  submitAttempts: number;
  pollCount: number;
}

// Draft fields a caller may write. `currentStep` lets the client persist where
// the user was so a draft can be resumed.
export interface KycDraftInput {
  currentStep?: KycStep;
  personalInfo?: KycApplication['personalInfo'];
  address?: KycApplication['address'];
  document?: KycApplication['document'];
}

let memory: ServerSnapshot | null = null;
let inFlightSubmit: Promise<KycApplication> | null = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function delay(ms: number = delayMs): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

// Deep clone so callers can never mutate the server's copy by reference.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now(): string {
  return new Date().toISOString();
}

function freshServer(): ServerSnapshot {
  return {
    application: {
      id: APPLICATION_ID,
      status: 'not_started',
      currentStep: 'personal_info',
      updatedAt: EPOCH,
    },
    submitAttempts: 0,
    pollCount: 0,
  };
}

// Lazily hydrate module state from AsyncStorage (the mirror), falling back to a
// fresh server if nothing is stored or the stored value is unreadable.
async function load(): Promise<ServerSnapshot> {
  if (memory) {
    return memory;
  }
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      memory = JSON.parse(raw) as ServerSnapshot;
    } catch {
      memory = freshServer();
    }
  } else {
    memory = freshServer();
  }
  return memory;
}

// Mirror the snapshot to AsyncStorage and keep the in-memory copy in sync.
async function persist(snapshot: ServerSnapshot): Promise<void> {
  memory = snapshot;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

// Resolve a submitted application to its terminal/needs-info outcome based on
// the document-number trigger.
function resolveOutcome(application: KycApplication): KycApplication {
  const documentNumber = application.document?.documentNumber;
  const base: KycApplication = { ...application, updatedAt: now() };

  if (documentNumber === TRIGGER_DOCUMENTS.REJECT) {
    return {
      ...base,
      status: 'rejected',
      rejectionReason: 'Document could not be verified.',
    };
  }

  if (documentNumber === TRIGGER_DOCUMENTS.MORE_INFO) {
    return {
      ...base,
      status: 'requires_more_info',
      requiredFields: [...STEP_REQUIRED_FIELDS.document],
    };
  }

  return { ...base, status: 'approved' };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchKycApplication(): Promise<KycApplication> {
  await delay();
  const server = await load();
  return clone(server.application);
}

export async function saveKycDraft(input: KycDraftInput): Promise<KycApplication> {
  await delay();
  const server = await load();
  const current = server.application;

  // Once the service owns the application (submitted/approved/rejected) the
  // client may not overwrite it.
  if (isServiceOwned(current.status)) {
    throw new KycServiceError(
      ERROR_CODES.CONFLICT,
      `Cannot edit an application in status "${current.status}".`
    );
  }

  const next: KycApplication = {
    ...current,
    ...(input.personalInfo ? { personalInfo: input.personalInfo } : {}),
    ...(input.address ? { address: input.address } : {}),
    ...(input.document ? { document: input.document } : {}),
    currentStep: input.currentStep ?? current.currentStep,
    status: 'draft',
    updatedAt: now(),
  };

  await persist({ ...server, application: next });
  return clone(next);
}

export function submitKycApplication(): Promise<KycApplication> {
  // Idempotent while in flight: concurrent callers share the same promise so a
  // double-tap can't produce two submissions.
  if (inFlightSubmit) {
    return inFlightSubmit;
  }

  const run = runSubmit();
  inFlightSubmit = run;
  // Clear the in-flight slot the moment `run` settles. Attaching the handler
  // directly to `run` (before the caller awaits it) guarantees it runs before
  // the caller resumes, so a re-submit right after an awaited submit re-evaluates
  // against the now-current status instead of reusing the settled promise.
  const clear = (): void => {
    if (inFlightSubmit === run) {
      inFlightSubmit = null;
    }
  };
  run.then(clear, clear);
  return run;
}

async function runSubmit(): Promise<KycApplication> {
  await delay();
  const server = await load();
  const current = server.application;

  if (isServiceOwned(current.status)) {
    throw new KycServiceError(
      ERROR_CODES.CONFLICT,
      `Cannot submit an application in status "${current.status}".`
    );
  }

  const documentNumber = current.document?.documentNumber;

  // NETWORK trigger: the very first submit fails at the network; a retry
  // succeeds. The attempt is recorded but the application is not advanced.
  if (
    documentNumber === TRIGGER_DOCUMENTS.NETWORK &&
    server.submitAttempts === 0
  ) {
    await persist({ ...server, submitAttempts: 1 });
    throw new KycServiceError(ERROR_CODES.NETWORK_ERROR, 'Network request failed.');
  }

  const next: KycApplication = {
    ...current,
    status: 'submitted',
    currentStep: 'status',
    rejectionReason: undefined,
    requiredFields: undefined,
    updatedAt: now(),
  };

  await persist({
    ...server,
    application: next,
    submitAttempts: server.submitAttempts + 1,
    pollCount: 0,
  });
  return clone(next);
}

export async function pollKycStatus(): Promise<KycApplication> {
  await delay();
  const server = await load();
  const current = server.application;

  // Only a submitted application is under review; anything else is returned
  // unchanged.
  if (current.status !== 'submitted') {
    return clone(current);
  }

  const polls = server.pollCount + 1;

  // Still pending until the resolution threshold is reached.
  if (polls < POLLS_UNTIL_RESOLUTION) {
    await persist({ ...server, pollCount: polls });
    return clone(current);
  }

  const resolved = resolveOutcome(current);
  await persist({ ...server, application: resolved, pollCount: polls });
  return clone(resolved);
}

// Start over: wipe the server back to a fresh, never-started application. The
// production counterpart of __reset — public, so the client's "Start over" can
// reset the backend (not just a test hook).
export async function resetKycApplication(): Promise<KycApplication> {
  await delay();
  const fresh = freshServer();
  inFlightSubmit = null;
  await persist(fresh);
  return clone(fresh.application);
}

// ── Test hooks ────────────────────────────────────────────────────────────────

// Clear all module + mirrored state. Await before each test for isolation.
export async function __reset(): Promise<void> {
  memory = null;
  inFlightSubmit = null;
  delayMs = DEFAULT_DELAY_MS;
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Override the simulated latency (ms). Tests set this to 0 to run instantly.
export function __setDelay(ms: number): void {
  delayMs = ms;
}

// Synchronously inspect the in-memory server snapshot without touching storage
// or incurring latency. Returns null before the first hydration.
export function __peek(): ServerSnapshot | null {
  return memory ? clone(memory) : null;
}
