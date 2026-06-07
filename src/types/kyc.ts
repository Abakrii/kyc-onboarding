// KYC domain contracts + derived lookups. Pure core: no I/O, no side effects.
//
// The four types below (KycStatus, KycStep, KycRequiredField, KycApplication)
// are copied VERBATIM from the frontend fake service contracts. Everything after
// them is derived metadata and guards built on top of those contracts.

// ── Service contracts (verbatim) ───────────────────────────────────────────

export type KycStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'requires_more_info'
  | 'approved'
  | 'rejected';

export type KycStep =
  | 'personal_info'
  | 'address'
  | 'document'
  | 'review'
  | 'status';

export type KycRequiredField =
  | 'personalInfo.legalName'
  | 'personalInfo.dateOfBirth'
  | 'personalInfo.nationality'
  | 'address.country'
  | 'address.city'
  | 'address.line1'
  | 'document.type'
  | 'document.documentNumber';

export interface KycApplication {
  id: string;
  status: KycStatus;
  currentStep: KycStep;
  personalInfo?: {
    legalName: string;
    dateOfBirth: string;
    nationality: string;
  };
  address?: {
    country: string;
    city: string;
    line1: string;
  };
  document?: {
    type: 'passport' | 'national_id' | 'drivers_license';
    documentNumber: string;
  };
  rejectionReason?: string;
  requiredFields?: KycRequiredField[];
  updatedAt: string;
}

// ── Wizard ordering (the uiPhase axis) ──────────────────────────────────────

// Canonical, ordered list of every phase the UI can show. Index into this for
// next/previous/progress. `satisfies` validates each entry is a real KycStep
// while keeping the literal tuple type (so the order is preserved at the type
// level).
export const WIZARD_STEPS = [
  'personal_info',
  'address',
  'document',
  'review',
  'status',
] as const satisfies readonly KycStep[];

// ── Required field ↔ step lookups ───────────────────────────────────────────

// Which step owns each required field. `Record<KycRequiredField, ...>` forces
// every field to be mapped — a new field won't compile until it's placed.
export const REQUIRED_FIELD_STEP: Record<KycRequiredField, KycStep> = {
  'personalInfo.legalName': 'personal_info',
  'personalInfo.dateOfBirth': 'personal_info',
  'personalInfo.nationality': 'personal_info',
  'address.country': 'address',
  'address.city': 'address',
  'address.line1': 'address',
  'document.type': 'document',
  'document.documentNumber': 'document',
};

// Inverse of REQUIRED_FIELD_STEP: the required fields collected on each step.
// `Record<KycStep, ...>` forces every step to be listed; steps with no fields
// (review, status) map to an empty array.
export const STEP_REQUIRED_FIELDS: Record<KycStep, readonly KycRequiredField[]> = {
  personal_info: [
    'personalInfo.legalName',
    'personalInfo.dateOfBirth',
    'personalInfo.nationality',
  ],
  address: ['address.country', 'address.city', 'address.line1'],
  document: ['document.type', 'document.documentNumber'],
  review: [],
  status: [],
};

// ── Status sets + guards (the remoteStatus axis) ────────────────────────────

// EDITABLE and SERVICE_OWNED partition every status; TERMINAL is a subset of
// SERVICE_OWNED. A status is exactly one of editable/service-owned.
//
//   editable        → the user may still change the application data
//   service-owned   → progression is in the service's hands; user can't edit
//   terminal        → a final state; no further transitions
export type EditableStatus = 'not_started' | 'draft' | 'requires_more_info';
export type ServiceOwnedStatus = 'submitted' | 'approved' | 'rejected';
export type TerminalStatus = 'approved' | 'rejected';

// Sets are typed `ReadonlySet<KycStatus>` so the guards can call `.has` with any
// KycStatus; the `satisfies` clauses validate the members against each subtype.
export const EDITABLE_STATUSES: ReadonlySet<KycStatus> = new Set<KycStatus>(
  ['not_started', 'draft', 'requires_more_info'] satisfies readonly EditableStatus[]
);

export const SERVICE_OWNED_STATUSES: ReadonlySet<KycStatus> = new Set<KycStatus>(
  ['submitted', 'approved', 'rejected'] satisfies readonly ServiceOwnedStatus[]
);

export const TERMINAL_STATUSES: ReadonlySet<KycStatus> = new Set<KycStatus>(
  ['approved', 'rejected'] satisfies readonly TerminalStatus[]
);

export const isEditable = (status: KycStatus): status is EditableStatus =>
  EDITABLE_STATUSES.has(status);

export const isServiceOwned = (status: KycStatus): status is ServiceOwnedStatus =>
  SERVICE_OWNED_STATUSES.has(status);

export const isTerminal = (status: KycStatus): status is TerminalStatus =>
  TERMINAL_STATUSES.has(status);
