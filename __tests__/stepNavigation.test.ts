// Covers the forward-skip guard: a user must not be able to jump to a later
// wizard step without filling the steps before it. The rule lives in the pure
// selector canNavigateToStep and is enforced by the reducer's GO_TO_STEP.

import { INCOMPLETE_STEP_BANNER, kycReducer } from '../src/state/kycReducer';
import { createInitialState, type KycState } from '../src/state/kycTypes';
import { canNavigateToStep, isStepFilled } from '../src/state/selectore';
import type { KycDraft } from '../src/types/kyc';

const PERSONAL = { legalName: 'A. Person', dateOfBirth: '1990-01-01', nationality: 'US' };
const ADDRESS = { country: 'US', city: 'NYC', line1: '1 Main St' };
const DOCUMENT = { type: 'passport' as const, documentNumber: 'AB123' };

const EMPTY: KycDraft = { currentStep: 'personal_info' };
const PERSONAL_ONLY: KycDraft = { currentStep: 'personal_info', personalInfo: PERSONAL };
const PERSONAL_ADDRESS: KycDraft = {
  currentStep: 'address',
  personalInfo: PERSONAL,
  address: ADDRESS,
};
const ALL: KycDraft = {
  currentStep: 'review',
  personalInfo: PERSONAL,
  address: ADDRESS,
  document: DOCUMENT,
};

function stateWith(draft: KycDraft): KycState {
  return { ...createInitialState(), uiPhase: 'idle', draft };
}

describe('isStepFilled', () => {
  it('is false when a required field is missing', () => {
    expect(isStepFilled(EMPTY, 'personal_info')).toBe(false);
    expect(isStepFilled(PERSONAL_ONLY, 'address')).toBe(false);
  });

  it('is false when a required field is whitespace-only', () => {
    const draft: KycDraft = {
      currentStep: 'personal_info',
      personalInfo: { ...PERSONAL, legalName: '   ' },
    };
    expect(isStepFilled(draft, 'personal_info')).toBe(false);
  });

  it('is true when every required field is filled', () => {
    expect(isStepFilled(PERSONAL_ONLY, 'personal_info')).toBe(true);
    expect(isStepFilled(ALL, 'document')).toBe(true);
  });

  it('is vacuously true for steps that own no required fields', () => {
    expect(isStepFilled(EMPTY, 'review')).toBe(true);
    expect(isStepFilled(EMPTY, 'status')).toBe(true);
  });
});

describe('canNavigateToStep', () => {
  it('always allows staying on or going back to an earlier step', () => {
    expect(canNavigateToStep(EMPTY, 'personal_info', 'personal_info')).toBe(true);
    expect(canNavigateToStep(EMPTY, 'document', 'personal_info')).toBe(true);
    expect(canNavigateToStep(EMPTY, 'review', 'address')).toBe(true);
  });

  it('blocks forward jumps past an incomplete current step', () => {
    expect(canNavigateToStep(EMPTY, 'personal_info', 'address')).toBe(false);
    expect(canNavigateToStep(EMPTY, 'personal_info', 'document')).toBe(false);
    expect(canNavigateToStep(EMPTY, 'personal_info', 'review')).toBe(false);
  });

  it('allows forward only as far as the first unfilled step', () => {
    // personal filled, address is the first unfilled step.
    expect(canNavigateToStep(PERSONAL_ONLY, 'personal_info', 'address')).toBe(true);
    expect(canNavigateToStep(PERSONAL_ONLY, 'personal_info', 'document')).toBe(false);

    // personal + address filled, document is the first unfilled step.
    expect(canNavigateToStep(PERSONAL_ADDRESS, 'address', 'document')).toBe(true);
    expect(canNavigateToStep(PERSONAL_ADDRESS, 'address', 'review')).toBe(false);
  });

  it('allows reaching review/status once every data step is filled', () => {
    expect(canNavigateToStep(ALL, 'personal_info', 'review')).toBe(true);
    expect(canNavigateToStep(ALL, 'personal_info', 'status')).toBe(true);
  });
});

describe('reducer GO_TO_STEP', () => {
  it('refuses a forward skip and surfaces the incomplete banner', () => {
    const next = kycReducer(stateWith(EMPTY), { type: 'GO_TO_STEP', step: 'document' });
    expect(next.draft.currentStep).toBe('personal_info');
    expect(next.banner).toBe(INCOMPLETE_STEP_BANNER);
  });

  it('allows going back to an earlier step (review edit link)', () => {
    const next = kycReducer(stateWith(ALL), {
      type: 'GO_TO_STEP',
      step: 'personal_info',
    });
    expect(next.draft.currentStep).toBe('personal_info');
    expect(next.banner).toBeNull();
  });

  it('allows a forward step once the current step is filled', () => {
    const next = kycReducer(stateWith(PERSONAL_ONLY), {
      type: 'GO_TO_STEP',
      step: 'address',
    });
    expect(next.draft.currentStep).toBe('address');
    expect(next.banner).toBeNull();
  });
});
