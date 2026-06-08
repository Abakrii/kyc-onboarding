import { computeBootstrap } from '../src/state/bootstrap';
import type { KycApplication, KycDraft } from '../src/types/kyc';

const remote = (overrides: Partial<KycApplication> = {}): KycApplication => ({
  id: 'kyc-local-application',
  status: 'not_started',
  currentStep: 'personal_info',
  updatedAt: '2026-06-08T00:00:00.000Z',
  ...overrides,
});

describe('computeBootstrap — resume step', () => {
  it('resumes a service-owned application on the status step', () => {
    const plan = computeBootstrap(null, remote({ status: 'submitted', currentStep: 'status' }));
    expect(plan.application.currentStep).toBe('status');
  });

  it('routes requires_more_info to the first still-required step and keeps local edits', () => {
    const local: KycDraft = {
      currentStep: 'document',
      personalInfo: { legalName: 'Ada', dateOfBirth: '1990-01-01', nationality: 'GB' },
    };
    const server = remote({
      status: 'requires_more_info',
      requiredFields: ['document.type', 'document.documentNumber'],
    });

    const plan = computeBootstrap(local, server);

    expect(plan.application.currentStep).toBe('document');
    expect(plan.application.personalInfo).toEqual(local.personalInfo);
  });

  it('resumes an editable draft where the user left off', () => {
    const local: KycDraft = {
      currentStep: 'address',
      address: { country: 'GB', city: 'London', line1: '1 St' },
    };
    const plan = computeBootstrap(local, remote({ status: 'draft' }));

    expect(plan.application.currentStep).toBe('address');
    expect(plan.application.address).toEqual(local.address);
  });

  it('falls back to the server step when there is no local draft', () => {
    const plan = computeBootstrap(null, remote({ status: 'not_started', currentStep: 'personal_info' }));
    expect(plan.application.currentStep).toBe('personal_info');
  });
});
