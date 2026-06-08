import {
  INCOMPLETE_STEP_BANNER,
  MORE_INFO_BANNER,
  kycReducer,
} from '../src/state/kycReducer';
import { createInitialState, type Action, type KycState } from '../src/state/kycTypes';
import type { KycApplication } from '../src/types/kyc';

function app(over: Partial<KycApplication> = {}): KycApplication {
  return {
    id: 'app-1',
    status: 'not_started',
    currentStep: 'personal_info',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

function run(state: KycState, ...actions: Action[]): KycState {
  return actions.reduce(kycReducer, state);
}

const FILLED_PERSONAL = {
  legalName: 'A. Person',
  dateOfBirth: '1990-01-01',
  nationality: 'US',
};

describe('createInitialState', () => {
  it('starts not_started + loading on personal_info', () => {
    expect(createInitialState()).toEqual({
      remoteStatus: 'not_started',
      uiPhase: 'loading',
      draft: { currentStep: 'personal_info' },
      requiredFields: [],
      rejectionReason: null,
      banner: null,
      error: null,
    });
  });
});

// NOTE: the transition table itself (canTransition / ALLOWED_TRANSTIONS) is
// owned by src/state/transtion.ts and exhaustively covered by transtions.test.ts.
// These tests exercise how the reducer *applies* that guard.

describe('EDIT_DRAFT', () => {
  it('applies a patch while editable', () => {
    const next = run(createInitialState(), {
      type: 'EDIT_DRAFT',
      patch: { personalInfo: FILLED_PERSONAL },
    });
    expect(next.draft.personalInfo).toEqual(FILLED_PERSONAL);
  });

  it('is ignored once the service owns the application', () => {
    const submitted = run(createInitialState(), {
      type: 'HYDRATE_SUCCESS',
      application: app({ status: 'submitted', currentStep: 'status' }),
    });
    const next = kycReducer(submitted, {
      type: 'EDIT_DRAFT',
      patch: { personalInfo: FILLED_PERSONAL },
    });
    expect(next).toBe(submitted);
    expect(next.draft.personalInfo).toBeUndefined();
  });
});

describe('NEXT_STEP validation', () => {
  it('blocks advancing with a banner when required fields are missing', () => {
    const next = kycReducer(createInitialState(), { type: 'NEXT_STEP' });
    expect(next.draft.currentStep).toBe('personal_info');
    expect(next.banner).toBe(INCOMPLETE_STEP_BANNER);
  });

  it('advances and clears the banner once the step is complete', () => {
    const next = run(
      createInitialState(),
      { type: 'EDIT_DRAFT', patch: { personalInfo: FILLED_PERSONAL } },
      { type: 'NEXT_STEP' }
    );
    expect(next.draft.currentStep).toBe('address');
    expect(next.banner).toBeNull();
  });

  it('advances freely through steps that require nothing (review)', () => {
    const onReview: KycState = {
      ...createInitialState(),
      draft: { currentStep: 'review' },
    };
    expect(kycReducer(onReview, { type: 'NEXT_STEP' }).draft.currentStep).toBe(
      'status'
    );
  });
});

describe('SUBMIT_START applies the saved draft', () => {
  // NOTE: this verifies only the *local* state move (not_started → draft, phase
  // → submitting). Whether the real submit network call fails-once-then-succeeds
  // is a service concern a pure reducer test cannot observe — proven end to end.
  it('advances remoteStatus not_started → draft and enters submitting', () => {
    const next = kycReducer(createInitialState(), { type: 'SUBMIT_START' });
    expect(next.remoteStatus).toBe('draft');
    expect(next.uiPhase).toBe('submitting');
  });

  it('is ignored when the application is already service-owned', () => {
    const submitted = run(createInitialState(), {
      type: 'HYDRATE_SUCCESS',
      application: app({ status: 'submitted', currentStep: 'status' }),
    });
    expect(kycReducer(submitted, { type: 'SUBMIT_START' })).toBe(submitted);
  });

  it('keeps remoteStatus at draft when the submit fails', () => {
    const next = run(
      createInitialState(),
      { type: 'SUBMIT_START' },
      { type: 'SUBMIT_FAILURE', error: 'NETWORK_ERROR' }
    );
    expect(next.remoteStatus).toBe('draft');
    expect(next.uiPhase).toBe('error');
    expect(next.error).toBe('NETWORK_ERROR');
  });
});

describe('polling', () => {
  function submitted(): KycState {
    return run(
      createInitialState(),
      { type: 'SUBMIT_START' },
      {
        type: 'SUBMIT_SUCCESS',
        application: app({ status: 'submitted', currentStep: 'status' }),
      }
    );
  }

  it('stays in polling while the application is still submitted', () => {
    const next = kycReducer(
      { ...submitted(), uiPhase: 'polling' },
      { type: 'POLL_RESULT', application: app({ status: 'submitted', currentStep: 'status' }) }
    );
    expect(next.remoteStatus).toBe('submitted');
    expect(next.uiPhase).toBe('polling');
  });

  it('settles to approved', () => {
    const next = kycReducer(submitted(), {
      type: 'POLL_RESULT',
      application: app({ status: 'approved', currentStep: 'status' }),
    });
    expect(next.remoteStatus).toBe('approved');
    expect(next.uiPhase).toBe('idle');
  });

  it('requires_more_info routes to the first required step with a banner', () => {
    const next = kycReducer(submitted(), {
      type: 'POLL_RESULT',
      application: app({
        status: 'requires_more_info',
        currentStep: 'status',
        requiredFields: ['document.type', 'document.documentNumber'],
      }),
    });
    expect(next.remoteStatus).toBe('requires_more_info');
    expect(next.draft.currentStep).toBe('document');
    expect(next.requiredFields).toEqual(['document.type', 'document.documentNumber']);
    expect(next.banner).toBe(MORE_INFO_BANNER);
    expect(next.uiPhase).toBe('idle');
  });

  it('guards against a stale result that would leave a terminal state', () => {
    const approved = kycReducer(submitted(), {
      type: 'POLL_RESULT',
      application: app({ status: 'approved', currentStep: 'status' }),
    });
    // A late "still submitted" poll must not drag approved back to submitted.
    const next = kycReducer(approved, {
      type: 'POLL_RESULT',
      application: app({ status: 'submitted', currentStep: 'status' }),
    });
    expect(next.remoteStatus).toBe('approved');
  });
});

describe('DISMISS_BANNER', () => {
  it('clears the banner', () => {
    const withBanner = kycReducer(createInitialState(), { type: 'NEXT_STEP' });
    expect(withBanner.banner).toBe(INCOMPLETE_STEP_BANNER);
    expect(kycReducer(withBanner, { type: 'DISMISS_BANNER' }).banner).toBeNull();
  });
});
