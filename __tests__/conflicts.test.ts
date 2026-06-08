import { DISCARDED_EDITS_BANNER, reconcile } from '../src/state/conflicts';
import type { KycApplication, KycDraft } from '../src/types/kyc';

const remote = (overrides: Partial<KycApplication> = {}): KycApplication => ({
  id: 'kyc-local-application',
  status: 'not_started',
  currentStep: 'personal_info',
  updatedAt: '2026-06-08T00:00:00.000Z',
  ...overrides,
});

const PERSONAL = { legalName: 'Ada', dateOfBirth: '1990-01-01', nationality: 'GB' };

describe('reconcile — service-owned (server wins)', () => {
  it('keeps the server copy and banners when the device held unsynced edits', () => {
    const local: KycDraft = { currentStep: 'review', personalInfo: { ...PERSONAL, legalName: 'Edited' } };
    const server = remote({ status: 'submitted', personalInfo: PERSONAL });

    const result = reconcile(local, server);

    expect(result.application).toBe(server);
    expect(result.banner).toBe(DISCARDED_EDITS_BANNER);
  });

  it('does not banner when the local draft matches the server', () => {
    const local: KycDraft = { currentStep: 'status', personalInfo: PERSONAL };
    const server = remote({ status: 'approved', personalInfo: PERSONAL });

    const result = reconcile(local, server);

    expect(result.banner).toBeNull();
  });

  it('does not banner when there is no local draft', () => {
    const result = reconcile(null, remote({ status: 'rejected' }));
    expect(result.banner).toBeNull();
  });
});

describe('reconcile — editable (local edits preserved)', () => {
  it('merges local sections over the server for requires_more_info', () => {
    const local: KycDraft = { currentStep: 'document', personalInfo: PERSONAL };
    const server = remote({ status: 'requires_more_info' });

    const result = reconcile(local, server);

    expect(result.application.personalInfo).toEqual(PERSONAL);
    expect(result.application.status).toBe('requires_more_info');
    expect(result.banner).toBeNull();
  });

  it('local wins for a draft that holds data', () => {
    const local: KycDraft = { currentStep: 'address', address: { country: 'GB', city: 'London', line1: '1 St' } };
    const server = remote({ status: 'draft' });

    const result = reconcile(local, server);

    expect(result.application.address).toEqual(local.address);
  });

  it('server wins for an empty local draft', () => {
    const local: KycDraft = { currentStep: 'personal_info' };
    const server = remote({ status: 'not_started' });

    const result = reconcile(local, server);

    expect(result.application).toBe(server);
  });
});
