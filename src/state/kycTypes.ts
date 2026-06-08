// State shapes for the KYC client state machine. The two orthogonal axes live
// side by side here: `remoteStatus` (the server truth) and `uiPhase` (what the
// client is doing right now). Pure types only — no logic, no side effects.

import type {
  KycApplication,
  KycDraft,
  KycRequiredField,
  KycStatus,
  KycStep,
} from '../types/kyc';

// The uiPhase axis: what interaction is in flight, independent of remoteStatus.
export type UiPhase =
  | 'loading'
  | 'idle'
  | 'saving'
  | 'submitting'
  | 'polling'
  | 'error';

// Non-optional section shapes, handy for form components and edit actions.
export type PersonalInfo = NonNullable<KycApplication['personalInfo']>;
export type AddressInfo = NonNullable<KycApplication['address']>;
export type DocumentInfo = NonNullable<KycApplication['document']>;

// A patch over the editable data sections (whole-section replacement).
export type DraftPatch = Partial<
  Pick<KycDraft, 'personalInfo' | 'address' | 'document'>
>;

export interface KycState {
  // ── remoteStatus axis: the server's view of the application ──
  remoteStatus: KycStatus;
  // ── uiPhase axis: what the client is doing right now ──
  uiPhase: UiPhase;

  // The working draft (editable slice + wizard position).
  draft: KycDraft;

  // Server-provided detail surfaced to the UI.
  requiredFields: KycRequiredField[];
  rejectionReason: string | null;

  // Transient UI feedback.
  banner: string | null;
  error: string | null;
}

export type Action =
  // Hydration / initial sync from the service.
  | { type: 'HYDRATE_START' }
  | { type: 'HYDRATE_SUCCESS'; application: KycApplication }
  | { type: 'HYDRATE_FAILURE'; error: string }
  // Editing + wizard navigation.
  | { type: 'EDIT_DRAFT'; patch: DraftPatch }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: KycStep }
  // Save lifecycle.
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; application: KycApplication }
  | { type: 'SAVE_FAILURE'; error: string }
  // Submit lifecycle.
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; application: KycApplication }
  | { type: 'SUBMIT_FAILURE'; error: string }
  // Poll lifecycle.
  | { type: 'POLL_START' }
  | { type: 'POLL_RESULT'; application: KycApplication }
  | { type: 'POLL_FAILURE'; error: string }
  // UI.
  | { type: 'DISMISS_BANNER' };

export function createInitialState(): KycState {
  return {
    remoteStatus: 'not_started',
    uiPhase: 'loading',
    draft: { currentStep: 'personal_info' },
    requiredFields: [],
    rejectionReason: null,
    banner: null,
    error: null,
  };
}
