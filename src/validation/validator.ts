// Field/step/application validation. Pure core: no I/O, no storage, no React,
// and — per the no-`Date.now()` rule — no reading the clock. The only
// time-dependent rule (date-of-birth must not be in the future) takes the
// current date as an explicit `now: Date` parameter, supplied by the
// side-effecting hook. Given the same inputs these return the same output.

import {
  STEP_REQUIRED_FIELDS,
  WIZARD_STEPS,
  type KycApplication,
  type KycRequiredField,
  type KycStep,
} from '../types/kyc';

// The data-bearing subset of an application that validation reads. A full
// KycApplication is structurally assignable to this, so callers can pass either
// a complete application or just the collected form data.
export type KycFormData = Pick<
  KycApplication,
  'personalInfo' | 'address' | 'document'
>;

export interface FieldError {
  field: KycRequiredField;
  message: string;
}

// Human-readable labels for each required field. `Record<KycRequiredField, ...>`
// forces a label for every field — a new field won't compile until it's named.
export const FIELD_LABEL: Record<KycRequiredField, string> = {
  'personalInfo.legalName': 'Legal name',
  'personalInfo.dateOfBirth': 'Date of birth',
  'personalInfo.nationality': 'Nationality',
  'address.country': 'Country',
  'address.city': 'City',
  'address.line1': 'Address line 1',
  'document.type': 'Document type',
  'document.documentNumber': 'Document number',
};

// Every required field, in wizard order. review/status contribute none.
const ALL_REQUIRED_FIELDS: readonly KycRequiredField[] = WIZARD_STEPS.flatMap(
  (step) => STEP_REQUIRED_FIELDS[step],
);

// Pull a single required field's raw value out of the form data, or undefined
// when the owning section / field has not been filled in yet.
export function getFieldValue(
  data: KycFormData,
  field: KycRequiredField,
): string | undefined {
  switch (field) {
    case 'personalInfo.legalName':
      return data.personalInfo?.legalName;
    case 'personalInfo.dateOfBirth':
      return data.personalInfo?.dateOfBirth;
    case 'personalInfo.nationality':
      return data.personalInfo?.nationality;
    case 'address.country':
      return data.address?.country;
    case 'address.city':
      return data.address?.city;
    case 'address.line1':
      return data.address?.line1;
    case 'document.type':
      return data.document?.type;
    case 'document.documentNumber':
      return data.document?.documentNumber;
  }
}

// Validate one field's value. Returns an error message, or undefined when valid.
// Every field is required (empty / whitespace-only is rejected); date-of-birth
// additionally must be a real ISO YYYY-MM-DD date that is not in the future.
export function validateField(
  field: KycRequiredField,
  value: string | undefined,
  now: Date,
): string | undefined {
  const trimmed = value?.trim() ?? '';
  if (trimmed.length === 0) {
    return `${FIELD_LABEL[field]} is required`;
  }
  if (field === 'personalInfo.dateOfBirth') {
    return validateDateOfBirth(trimmed, now);
  }
  return undefined;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function validateDateOfBirth(value: string, now: Date): string | undefined {
  const label = FIELD_LABEL['personalInfo.dateOfBirth'];

  const match = ISO_DATE.exec(value);
  if (!match) {
    return `${label} must be in YYYY-MM-DD format`;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Build the date in UTC and confirm every component survived round-trip —
  // this rejects overflowed values like 2021-02-30 or month 13.
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  if (!isRealDate) {
    return `${label} is not a valid date`;
  }

  // Compare date-only in UTC; born-today is allowed, tomorrow onward is not.
  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  if (date.getTime() > todayUTC) {
    return `${label} cannot be in the future`;
  }

  return undefined;
}

function collectErrors(
  data: KycFormData,
  fields: readonly KycRequiredField[],
  now: Date,
): FieldError[] {
  return fields.flatMap((field) => {
    const message = validateField(field, getFieldValue(data, field), now);
    return message ? [{ field, message }] : [];
  });
}

// Errors for the required fields owned by a single wizard step (empty array when
// the step is valid, or owns no fields — e.g. review / status).
export function validateStep(
  data: KycFormData,
  step: KycStep,
  now: Date,
): FieldError[] {
  return collectErrors(data, STEP_REQUIRED_FIELDS[step], now);
}

// Errors across every required field of the application.
export function validateAll(data: KycFormData, now: Date): FieldError[] {
  return collectErrors(data, ALL_REQUIRED_FIELDS, now);
}

// True when no required field has an error — i.e. the application is ready to
// submit.
export function isApplicationComplete(data: KycFormData, now: Date): boolean {
  return validateAll(data, now).length === 0;
}
