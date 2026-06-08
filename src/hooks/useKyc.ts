// useKyc — THE single side-effecting hook (per AGENTS.md). Every effect the app
// performs funnels through here: storage (draft persistence), network (the fake
// service), and timers (status polling). Components stay declarative and call
// into this hook; they run no effects of their own.
//
// The hook owns the two axes only by dispatching into the pure reducer — it
// never mutates state directly. Async callbacks read the latest state through a
// ref (`stateRef`) so a request that resolves several renders later still sees
// fresh values instead of the state captured when the callback was created.
//
// SECURITY: this hook moves KYC PII (name, DOB, address, document number)
// between storage and the service. It never logs it — caught errors are mapped
// to generic, PII-free user messages via `toMessage`.

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import {
  ERROR_CODES,
  KycServiceError,
  fetchKycApplication,
  pollKycStatus,
  saveKycDraft,
  submitKycApplication,
} from '../services/fakeKycServices';
import { kycReducer } from '../state/kycReducer';
import {
  createInitialState,
  type DraftPatch,
  type KycState,
} from '../state/kycTypes';
import { firstStepForRequiredFields } from '../state/selectore';
import { clearDraft, loadDraft, saveDraft } from '../storage/draftStorage';
import { isEditable, isTerminal, type KycStep } from '../types/kyc';
import { validateAll, validateStep, type FieldError } from '../validation/validator';

// How often to re-poll a submitted application until the service resolves it.
const POLL_INTERVAL_MS = 1500;

// The imperative surface a component drives the flow with. Every entry is a
// stable callback (identities never change across renders).
export interface KycActions {
  /** Replace one or more editable sections of the draft (whole-section patch). */
  editField: (patch: DraftPatch) => void;
  /** Advance one wizard step (validates the current step's required fields). */
  next: () => void;
  /** Go back one wizard step. */
  prev: () => void;
  /** Jump to a specific wizard step (no validation). */
  goToStep: (step: KycStep) => void;
  /** Save the draft to the service and submit the application, then poll. */
  submit: () => void;
  /** Re-attempt the last failed async operation (hydrate or submit). */
  retry: () => void;
  /** Clear the local draft cache and re-sync from the service. */
  reset: () => void;
  /** Dismiss the transient banner. */
  dismissBanner: () => void;
}

export interface KycContextValue extends KycActions {
  state: KycState;
  /** Validation errors for the current step's required fields (empty when valid). */
  errors: FieldError[];
}

// Map any thrown error to a generic, PII-free message safe to show and (if it
// came to that) to log. The underlying service messages are already generic, but
// we never surface raw errors to the UI from here.
function toMessage(error: unknown): string {
  if (error instanceof KycServiceError) {
    return error.code === ERROR_CODES.NETWORK_ERROR
      ? 'Network error. Please check your connection and try again.'
      : 'That action conflicts with the current application status.';
  }
  return 'Something went wrong. Please try again.';
}

export function useKyc(): KycContextValue {
  const [state, dispatch] = useReducer(kycReducer, createInitialState());

  // ── Refs so async callbacks read fresh state, not stale closures ──
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // Don't dispatch into an unmounted tree (requests outlive the component).
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  // Gate draft persistence until the first hydration succeeds, so the throwaway
  // initial draft never clobbers a stored one before we've loaded it.
  const hydratedRef = useRef(false);
  // Which async op to re-run on `retry`.
  const lastOpRef = useRef<'hydrate' | 'submit'>('hydrate');

  // ── Bootstrap: fetch the server application + load the local draft ──
  const bootstrap = useCallback(async () => {
    lastOpRef.current = 'hydrate';
    dispatch({ type: 'HYDRATE_START' });
    try {
      const [application, localDraft] = await Promise.all([
        fetchKycApplication(),
        loadDraft(),
      ]);
      if (!mountedRef.current) {
        return;
      }
      // TODO(reconcile): merge `localDraft` into the hydrated state when the
      // server is no further along than the draft. For now the server
      // application is authoritative; the draft is loaded so the wiring is in
      // place. Until this lands, the first post-hydrate persist mirrors the
      // server draft rather than a richer local one.
      void localDraft;
      dispatch({ type: 'HYDRATE_SUCCESS', application });
      hydratedRef.current = true;
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      // Leave hydratedRef false on failure so we don't persist (and clobber) the
      // stored draft over a transient fetch error.
      dispatch({ type: 'HYDRATE_FAILURE', error: toMessage(error) });
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // ── Persist the draft on change; clear it once the application is terminal ──
  useEffect(() => {
    if (!hydratedRef.current) {
      return;
    }
    if (isTerminal(state.remoteStatus)) {
      void clearDraft();
      return;
    }
    void saveDraft(state.draft);
  }, [state.draft, state.remoteStatus]);

  // ── Poll a submitted application until the service resolves it ──
  useEffect(() => {
    if (state.remoteStatus !== 'submitted') {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async (): Promise<void> => {
      dispatch({ type: 'POLL_START' });
      try {
        const application = await pollKycStatus();
        if (cancelled || !mountedRef.current) {
          return;
        }
        dispatch({ type: 'POLL_RESULT', application });
      } catch (error) {
        if (cancelled || !mountedRef.current) {
          return;
        }
        dispatch({ type: 'POLL_FAILURE', error: toMessage(error) });
      }
      // Keep polling while we're still submitted; a status change re-runs this
      // effect and cancels the chain via cleanup.
      if (!cancelled) {
        timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
      }
    };

    void tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [state.remoteStatus]);

  // ── Async lifecycles ──
  // The submit pipeline: SAVE_START → saveKycDraft → SUBMIT_START → submit →
  // SUBMIT_SUCCESS. A save failure stops before submit; either failure lands in
  // the error state (uiPhase 'error') and is recoverable via `retry`. Once
  // SUBMIT_SUCCESS lands the app in `submitted`, the polling effect takes over.
  const runSubmit = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SAVE_START' });
    try {
      await saveKycDraft(stateRef.current.draft);
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      dispatch({ type: 'SAVE_FAILURE', error: toMessage(error) });
      return;
    }
    if (!mountedRef.current) {
      return;
    }

    dispatch({ type: 'SUBMIT_START' });
    try {
      const application = await submitKycApplication();
      if (!mountedRef.current) {
        return;
      }
      dispatch({ type: 'SUBMIT_SUCCESS', application });
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      dispatch({ type: 'SUBMIT_FAILURE', error: toMessage(error) });
    }
  }, []);

  // ── Imperative actions (stable identities) ──
  const editField = useCallback((patch: DraftPatch) => {
    dispatch({ type: 'EDIT_DRAFT', patch });
  }, []);

  const next = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prev = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const goToStep = useCallback((step: KycStep) => {
    dispatch({ type: 'GO_TO_STEP', step });
  }, []);

  const submit = useCallback(() => {
    const { draft, remoteStatus } = stateRef.current;
    if (!isEditable(remoteStatus)) {
      return;
    }
    // Validate the whole application first. If anything is invalid, route to the
    // earliest step that owns a failing field instead of submitting.
    const invalid = validateAll(draft, new Date());
    if (invalid.length > 0) {
      const step = firstStepForRequiredFields(invalid.map((e) => e.field));
      if (step) {
        dispatch({ type: 'GO_TO_STEP', step });
      }
      return;
    }
    lastOpRef.current = 'submit';
    void runSubmit();
  }, [runSubmit]);

  const retry = useCallback(() => {
    if (lastOpRef.current === 'submit') {
      submit();
    } else {
      void bootstrap();
    }
  }, [bootstrap, submit]);

  const reset = useCallback(() => {
    void clearDraft();
    void bootstrap();
  }, [bootstrap]);

  const dismissBanner = useCallback(() => {
    dispatch({ type: 'DISMISS_BANNER' });
  }, []);

  // Validation errors for the current step. The clock read lives here (the one
  // side-effecting layer); validateStep itself is a pure core that takes `now`.
  const errors = useMemo(
    () => validateStep(state.draft, state.draft.currentStep, new Date()),
    [state.draft]
  );

  return {
    state,
    errors,
    editField,
    next,
    prev,
    goToStep,
    submit,
    retry,
    reset,
    dismissBanner,
  };
}
