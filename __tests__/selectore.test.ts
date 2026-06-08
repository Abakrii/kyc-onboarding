import {
  firstStepForRequiredFields,
  isFieldStep,
  nextStep,
  prevStep,
} from '../src/state/selectore';
import { WIZARD_STEPS, type KycStep } from '../src/types/kyc';

describe('nextStep', () => {
  it.each([
    ['personal_info', 'address'],
    ['address', 'document'],
    ['document', 'review'],
    ['review', 'status'],
  ] as const)('advances %s -> %s', (from, to) => {
    expect(nextStep(from)).toBe(to);
  });

  it('returns undefined past the last step', () => {
    expect(nextStep('status')).toBeUndefined();
  });

  it('walks the whole wizard in order', () => {
    const walked: KycStep[] = ['personal_info'];
    let step = nextStep('personal_info');
    while (step !== undefined) {
      walked.push(step);
      step = nextStep(step);
    }
    expect(walked).toEqual([...WIZARD_STEPS]);
  });
});

describe('prevStep', () => {
  it.each([
    ['status', 'review'],
    ['review', 'document'],
    ['document', 'address'],
    ['address', 'personal_info'],
  ] as const)('goes back %s -> %s', (from, to) => {
    expect(prevStep(from)).toBe(to);
  });

  it('returns undefined before the first step', () => {
    expect(prevStep('personal_info')).toBeUndefined();
  });

  it('is the inverse of nextStep across every adjacent pair', () => {
    for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
      const a = WIZARD_STEPS[i];
      const b = WIZARD_STEPS[i + 1];
      expect(nextStep(a)).toBe(b);
      expect(prevStep(b)).toBe(a);
    }
  });
});

describe('isFieldStep', () => {
  it.each(['personal_info', 'address', 'document'] as const)(
    'classifies %s as a field step',
    (step) => {
      expect(isFieldStep(step)).toBe(true);
    },
  );

  it.each(['review', 'status'] as const)(
    'classifies %s as a non-field step',
    (step) => {
      expect(isFieldStep(step)).toBe(false);
    },
  );
});

describe('firstStepForRequiredFields', () => {
  it('returns undefined for an empty list', () => {
    expect(firstStepForRequiredFields([])).toBeUndefined();
  });

  it('resolves a single field to its owning step', () => {
    expect(firstStepForRequiredFields(['address.city'])).toBe('address');
    expect(firstStepForRequiredFields(['document.documentNumber'])).toBe('document');
  });

  it('picks the earliest owning step in wizard order, regardless of input order', () => {
    expect(
      firstStepForRequiredFields([
        'document.type',
        'address.line1',
        'personalInfo.legalName',
      ]),
    ).toBe('personal_info');
  });

  it('ignores later steps when an earlier one also has a field', () => {
    expect(
      firstStepForRequiredFields(['document.documentNumber', 'address.country']),
    ).toBe('address');
  });

  it('resolves fields that all belong to the same step', () => {
    expect(
      firstStepForRequiredFields([
        'personalInfo.legalName',
        'personalInfo.dateOfBirth',
        'personalInfo.nationality',
      ]),
    ).toBe('personal_info');
  });
});
