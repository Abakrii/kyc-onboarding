// Pure selectors over the `uiPhase` axis (KycStep) and the wizard ordering.
// Pure core: no I/O, no Date.now(), no randomness, no React — given the same
// inputs they return the same output. These derive navigation and step metadata
// from WIZARD_STEPS / the required-field lookups in ../types/kyc.

import {
  REQUIRED_FIELD_STEP,
  STEP_REQUIRED_FIELDS,
  WIZARD_STEPS,
  type KycRequiredField,
  type KycStep,
} from '../types/kyc';
import { getFieldValue, type KycFormData } from '../validation/validator';

// The step after `step` in wizard order, or `undefined` at the last step.
// Callers that want to clamp can use `nextStep(s) ?? s`.
export const nextStep = (step: KycStep): KycStep | undefined =>
  WIZARD_STEPS[WIZARD_STEPS.indexOf(step) + 1];

// The step before `step` in wizard order, or `undefined` at the first step.
// (indexOf('personal_info') - 1 === -1, and WIZARD_STEPS[-1] is undefined.)
export const prevStep = (step: KycStep): KycStep | undefined =>
  WIZARD_STEPS[WIZARD_STEPS.indexOf(step) - 1];

// True when the step collects required fields (personal_info / address /
// document). The metadata steps (review / status) own no fields. Derived from
// STEP_REQUIRED_FIELDS so it stays in sync as fields move between steps.
export const isFieldStep = (step: KycStep): boolean =>
  STEP_REQUIRED_FIELDS[step].length > 0;

// The earliest wizard step (in WIZARD_STEPS order) that owns any of the given
// required fields — e.g. to send the user back to the first step they must fix
// after a `requires_more_info` response. `undefined` when no field maps to a
// step (including the empty-list case).
export const firstStepForRequiredFields = (
  fields: readonly KycRequiredField[],
): KycStep | undefined => {
  const owning = new Set<KycStep>(fields.map((field) => REQUIRED_FIELD_STEP[field]));
  return WIZARD_STEPS.find((step) => owning.has(step));
};

// A required field counts as filled when present and not just whitespace.
const isFilled = (value: string | undefined): boolean =>
  value !== undefined && value.trim().length > 0;

// True when every required field a step owns is filled in. Clock-free: a
// presence/blank check only — the date-of-birth format/not-future rules are
// enforced separately by the validator (at Next and submit). Steps with no
// required fields (review / status) are vacuously complete.
export const isStepFilled = (data: KycFormData, step: KycStep): boolean =>
  STEP_REQUIRED_FIELDS[step].every((field) => isFilled(getFieldValue(data, field)));

// Index of the first wizard step with an unfilled required field, or
// WIZARD_STEPS.length when every step is filled.
const firstUnfilledIndex = (data: KycFormData): number => {
  const i = WIZARD_STEPS.findIndex((step) => !isStepFilled(data, step));
  return i === -1 ? WIZARD_STEPS.length : i;
};

// Navigation guard for the stepper / review "edit" links. Going to the current
// step or back to an earlier one is always allowed; going forward is allowed
// only as far as the first step whose required fields are not yet filled — so
// the user can't skip past an incomplete step.
export const canNavigateToStep = (
  data: KycFormData,
  from: KycStep,
  to: KycStep,
): boolean => {
  const toIndex = WIZARD_STEPS.indexOf(to);
  const fromIndex = WIZARD_STEPS.indexOf(from);
  if (toIndex <= fromIndex) {
    return true;
  }
  return toIndex <= firstUnfilledIndex(data);
};
