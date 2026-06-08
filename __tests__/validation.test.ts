import type { KycRequiredField } from '../src/types/kyc';
import {
  FIELD_LABEL,
  getFieldValue,
  isApplicationComplete,
  validateAll,
  validateField,
  validateStep,
  type KycFormData,
} from '../src/validation/validator';

// Fixed reference "today" so the not-in-the-future rule is deterministic.
const NOW = new Date('2026-06-08T12:00:00.000Z');

const ALL_FIELDS: KycRequiredField[] = [
  'personalInfo.legalName',
  'personalInfo.dateOfBirth',
  'personalInfo.nationality',
  'address.country',
  'address.city',
  'address.line1',
  'document.type',
  'document.documentNumber',
];

const COMPLETE = {
  personalInfo: {
    legalName: 'Ada Lovelace',
    dateOfBirth: '1990-05-20',
    nationality: 'GB',
  },
  address: { country: 'GB', city: 'London', line1: '12 Baker St' },
  document: { type: 'passport', documentNumber: 'AB123456' },
} satisfies KycFormData;

describe('validateField — required / whitespace', () => {
  it.each(ALL_FIELDS)('rejects %s when undefined', (field) => {
    expect(validateField(field, undefined, NOW)).toMatch(/required/i);
  });

  it.each(ALL_FIELDS)('rejects %s when empty', (field) => {
    expect(validateField(field, '', NOW)).toBe(`${FIELD_LABEL[field]} is required`);
  });

  it.each(ALL_FIELDS)('rejects %s when whitespace-only', (field) => {
    expect(validateField(field, '   \t ', NOW)).toMatch(/required/i);
  });

  it('accepts a non-empty value (and ignores surrounding whitespace)', () => {
    expect(validateField('address.city', '  London  ', NOW)).toBeUndefined();
  });
});

describe('validateField — date of birth', () => {
  const DOB = 'personalInfo.dateOfBirth';

  it('accepts a valid past ISO date', () => {
    expect(validateField(DOB, '1990-05-20', NOW)).toBeUndefined();
  });

  it('accepts a whitespace-padded valid date', () => {
    expect(validateField(DOB, '  1990-05-20 ', NOW)).toBeUndefined();
  });

  it('accepts today (born today is not in the future)', () => {
    expect(validateField(DOB, '2026-06-08', NOW)).toBeUndefined();
  });

  it.each(['06/08/1990', '1990-1-1', '90-05-20', '1990/05/20', '1990-05-20T00:00'])(
    'rejects non ISO YYYY-MM-DD format: %s',
    (value) => {
      expect(validateField(DOB, value, NOW)).toMatch(/format/i);
    },
  );

  it.each(['1990-02-30', '1990-13-01', '1990-00-10', '1990-05-00'])(
    'rejects an unparseable / impossible date: %s',
    (value) => {
      expect(validateField(DOB, value, NOW)).toMatch(/valid date/i);
    },
  );

  it.each(['2026-06-09', '2030-01-01'])('rejects a future date: %s', (value) => {
    expect(validateField(DOB, value, NOW)).toMatch(/future/i);
  });
});

describe('getFieldValue', () => {
  it('reads a nested value', () => {
    expect(getFieldValue(COMPLETE, 'document.documentNumber')).toBe('AB123456');
    expect(getFieldValue(COMPLETE, 'personalInfo.legalName')).toBe('Ada Lovelace');
  });

  it('returns undefined when the owning section is absent', () => {
    expect(getFieldValue({}, 'address.country')).toBeUndefined();
    expect(getFieldValue({ personalInfo: COMPLETE.personalInfo }, 'document.type')).toBeUndefined();
  });
});

describe('validateStep', () => {
  it('returns one error per missing field on the step', () => {
    const errors = validateStep({}, 'personal_info', NOW);
    expect(errors.map((e) => e.field).sort()).toEqual(
      [
        'personalInfo.dateOfBirth',
        'personalInfo.legalName',
        'personalInfo.nationality',
      ].sort(),
    );
  });

  it('returns no errors when the step is valid', () => {
    expect(validateStep(COMPLETE, 'personal_info', NOW)).toEqual([]);
    expect(validateStep(COMPLETE, 'address', NOW)).toEqual([]);
    expect(validateStep(COMPLETE, 'document', NOW)).toEqual([]);
  });

  it('returns no errors for steps that own no fields', () => {
    expect(validateStep({}, 'review', NOW)).toEqual([]);
    expect(validateStep({}, 'status', NOW)).toEqual([]);
  });

  it('flags a future DOB on its step', () => {
    const data: KycFormData = {
      personalInfo: { legalName: 'A', dateOfBirth: '2999-01-01', nationality: 'GB' },
    };
    const errors = validateStep(data, 'personal_info', NOW);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ field: 'personalInfo.dateOfBirth' });
    expect(errors[0].message).toMatch(/future/i);
  });
});

describe('validateAll / isApplicationComplete', () => {
  it('reports an error for every field of an empty application', () => {
    const errors = validateAll({}, NOW);
    expect(errors).toHaveLength(ALL_FIELDS.length);
    expect(isApplicationComplete({}, NOW)).toBe(false);
  });

  it('treats a fully valid application as complete', () => {
    expect(validateAll(COMPLETE, NOW)).toEqual([]);
    expect(isApplicationComplete(COMPLETE, NOW)).toBe(true);
  });

  it('is incomplete when an otherwise-full application has a future DOB', () => {
    const data: KycFormData = {
      ...COMPLETE,
      personalInfo: { ...COMPLETE.personalInfo, dateOfBirth: '2099-12-31' },
    };
    expect(isApplicationComplete(data, NOW)).toBe(false);
  });
});
