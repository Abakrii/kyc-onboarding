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
