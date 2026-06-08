// The KYC client reducer. PURE: (state, action) => state, no I/O, no clock, no
// logging. Both axes are managed here — remoteStatus only ever moves through the
// shared guarded transition table (./transtion); uiPhase tracks what the client
// is doing. Step navigation defers to the shared selectors (./selectore).

import {
  isEditable,
  STEP_REQUIRED_FIELDS,
  type KycApplication,
  type KycDraft,
  type KycRequiredField,
  type KycStatus,
} from '../types/kyc';
import { canTransition } from './transtion';
import {
  firstStepForRequiredFields,
  nextStep,
  prevStep,
} from './selectore';
import {
  createInitialState,
  type Action,
  type KycState,
  type UiPhase,
} from './kycTypes';

// User-facing banners. No PII — generic guidance only.
export const MORE_INFO_BANNER =
  'We need a little more information to finish verifying your identity.';
export const INCOMPLETE_STEP_BANNER =
  'Please complete the required fields on this step before continuing.';

// Resolve a desired status against the shared table: take it if allowed, else
// stay put. This is how the reducer guards every remoteStatus change.
function guarded(from: KycStatus, to: KycStatus): KycStatus {
  return canTransition(from, to) ? to : from;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function readField(draft: KycDraft, field: KycRequiredField): string | undefined {
  switch (field) {
    case 'personalInfo.legalName':
      return draft.personalInfo?.legalName;
    case 'personalInfo.dateOfBirth':
      return draft.personalInfo?.dateOfBirth;
    case 'personalInfo.nationality':
      return draft.personalInfo?.nationality;
    case 'address.country':
      return draft.address?.country;
    case 'address.city':
      return draft.address?.city;
    case 'address.line1':
      return draft.address?.line1;
    case 'document.type':
      return draft.document?.type;
    case 'document.documentNumber':
      return draft.document?.documentNumber;
    default: {
      const exhaustive: never = field;
      return exhaustive;
    }
  }
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === '';
}

// Adopt the server's editable slice + detail into state under a (pre-resolved)
// remoteStatus, routing the user to the first outstanding step when more info is
// required.
function applyServer(
  state: KycState,
  application: KycApplication,
  remoteStatus: KycStatus
): KycState {
  const requiredFields = application.requiredFields ?? [];
  const rejectionReason = application.rejectionReason ?? null;

  let draft: KycDraft = {
    currentStep: application.currentStep,
    ...(application.personalInfo ? { personalInfo: application.personalInfo } : {}),
    ...(application.address ? { address: application.address } : {}),
    ...(application.document ? { document: application.document } : {}),
  };

  let banner = state.banner;

  if (remoteStatus === 'requires_more_info') {
    const target = firstStepForRequiredFields(requiredFields);
    draft = { ...draft, currentStep: target ?? draft.currentStep };
    banner = MORE_INFO_BANNER;
  }

  return {
    ...state,
    remoteStatus,
    draft,
    requiredFields,
    rejectionReason,
    banner,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export function kycReducer(state: KycState, action: Action): KycState {
  switch (action.type) {
    case 'HYDRATE_START':
      return { ...state, uiPhase: 'loading', error: null };

    case 'HYDRATE_SUCCESS': {
      // Initial sync is authoritative: adopt the server status directly rather
      // than as a guarded in-session transition. An optional reconcile banner
      // (e.g. discarded local edits) overrides any banner applyServer set.
      const next = applyServer(state, action.application, action.application.status);
      return {
        ...next,
        uiPhase: 'idle',
        banner: action.banner ?? next.banner,
      };
    }

    case 'HYDRATE_FAILURE':
      return { ...state, uiPhase: 'error', error: action.error };

    case 'EDIT_DRAFT':
      // Ignore edits once the service owns the application.
      if (!isEditable(state.remoteStatus)) {
        return state;
      }
      return { ...state, draft: { ...state.draft, ...action.patch } };

    case 'NEXT_STEP': {
      const step = state.draft.currentStep;
      const missing = STEP_REQUIRED_FIELDS[step].filter((field) =>
        isBlank(readField(state.draft, field))
      );
      if (missing.length > 0) {
        return { ...state, banner: INCOMPLETE_STEP_BANNER };
      }
      const next = nextStep(step);
      if (next === undefined) {
        return { ...state, banner: null };
      }
      return { ...state, draft: { ...state.draft, currentStep: next }, banner: null };
    }

    case 'PREV_STEP': {
      const prev = prevStep(state.draft.currentStep);
      if (prev === undefined) {
        return state;
      }
      return { ...state, draft: { ...state.draft, currentStep: prev }, banner: null };
    }

    case 'GO_TO_STEP':
      // Free navigation (e.g. back from the review step) — no validation.
      return {
        ...state,
        draft: { ...state.draft, currentStep: action.step },
        banner: null,
      };

    case 'SAVE_START':
      if (!isEditable(state.remoteStatus)) {
        return state;
      }
      return { ...state, uiPhase: 'saving', error: null };

    case 'SAVE_SUCCESS':
      // The local draft is authoritative (we authored it); only adopt the
      // server status, guarded, and settle back to idle.
      return {
        ...state,
        remoteStatus: guarded(state.remoteStatus, action.application.status),
        uiPhase: 'idle',
        error: null,
      };

    case 'SAVE_FAILURE':
      return { ...state, uiPhase: 'error', error: action.error };

    case 'SUBMIT_START':
      // Can't submit something the service already owns.
      if (!isEditable(state.remoteStatus)) {
        return state;
      }
      // Applying the saved draft commits it: advance remoteStatus toward draft
      // (guarded — a no-op from requires_more_info, which the table only lets
      // resubmit straight to submitted) before the request goes out. On a failed
      // submit the status stays put; a retry can re-submit from here.
      return {
        ...state,
        remoteStatus: guarded(state.remoteStatus, 'draft'),
        uiPhase: 'submitting',
        banner: null,
        error: null,
      };

    case 'SUBMIT_SUCCESS':
      return {
        ...applyServer(
          state,
          action.application,
          guarded(state.remoteStatus, action.application.status)
        ),
        uiPhase: 'idle',
      };

    case 'SUBMIT_FAILURE':
      return { ...state, uiPhase: 'error', error: action.error };

    case 'POLL_START':
      // Only a submitted application is under review.
      if (state.remoteStatus !== 'submitted') {
        return state;
      }
      return { ...state, uiPhase: 'polling', error: null };

    case 'POLL_RESULT': {
      const remoteStatus = guarded(state.remoteStatus, action.application.status);
      const next = applyServer(state, action.application, remoteStatus);
      // Still submitted → keep polling; any resolution settles to idle. A
      // successful result supersedes any prior poll error.
      const uiPhase: UiPhase = remoteStatus === 'submitted' ? 'polling' : 'idle';
      return { ...next, uiPhase, error: null };
    }

    case 'POLL_FAILURE':
      return { ...state, uiPhase: 'error', error: action.error };

    case 'DISMISS_BANNER':
      return { ...state, banner: null };

    case 'RESET':
      // Start over: a fresh application, but settled (idle) rather than the
      // initial loading phase since there's nothing to fetch.
      return { ...createInitialState(), uiPhase: 'idle' };

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
