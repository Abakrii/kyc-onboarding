// Outcome-level tests for the submit lifecycle and transition guarding, exercised
// through the pure reducer (the same dispatches the hook's submit() drives).

import { kycReducer } from '../src/state/kycReducer';
import { createInitialState, type KycState } from '../src/state/kycTypes';
import type { KycApplication } from '../src/types/kyc';

function baseState(overrides: Partial<KycState> = {}): KycState {
  return { ...createInitialState(), uiPhase: 'idle', ...overrides };
}

const app = (overrides: Partial<KycApplication> = {}): KycApplication => ({
  id: 'kyc-local-application',
  status: 'submitted',
  currentStep: 'status',
  updatedAt: '2026-06-08T00:00:00.000Z',
  ...overrides,
});

describe('submit success', () => {
  it('drives a draft through save → submit → poll to approved', () => {
    let state = baseState({ remoteStatus: 'not_started' });

    // SAVE_START (uiPhase only; remoteStatus unchanged).
    state = kycReducer(state, { type: 'SAVE_START' });
    expect(state.uiPhase).toBe('saving');

    // SUBMIT_START commits the draft (guarded → 'draft') and goes submitting.
    state = kycReducer(state, { type: 'SUBMIT_START' });
    expect(state.remoteStatus).toBe('draft');
    expect(state.uiPhase).toBe('submitting');

    // SUBMIT_SUCCESS adopts the server's submitted status, settles to idle.
    state = kycReducer(state, { type: 'SUBMIT_SUCCESS', application: app({ status: 'submitted' }) });
    expect(state.remoteStatus).toBe('submitted');
    expect(state.uiPhase).toBe('idle');

    // Poll until resolved.
    state = kycReducer(state, { type: 'POLL_START' });
    expect(state.uiPhase).toBe('polling');

    state = kycReducer(state, { type: 'POLL_RESULT', application: app({ status: 'approved' }) });
    expect(state.remoteStatus).toBe('approved');
    expect(state.uiPhase).toBe('idle');
  });
});

describe('guarded illegal transition', () => {
  it('keeps a terminal application terminal despite an illegal server status', () => {
    const approved = baseState({ remoteStatus: 'approved' });

    // approved → draft is not a legal transition; the reducer guards it.
    const polled = kycReducer(approved, {
      type: 'POLL_RESULT',
      application: app({ status: 'draft' }),
    });
    expect(polled.remoteStatus).toBe('approved');

    // And edits on a service-owned/terminal application are a no-op.
    const edited = kycReducer(approved, {
      type: 'EDIT_DRAFT',
      patch: {
        personalInfo: { legalName: 'X', dateOfBirth: '2000-01-01', nationality: 'GB' },
      },
    });
    expect(edited).toBe(approved);
  });
});
