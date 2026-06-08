import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ERROR_CODES,
  KycServiceError,
  TRIGGER_DOCUMENTS,
  __peek,
  __reset,
  fetchKycApplication,
  pollKycStatus,
  saveKycDraft,
  submitKycApplication,
  type KycDraftInput,
} from '../src/services/fakeKycServices';
import type { KycApplication } from '../src/types/kyc';

const DOC = (documentNumber: string): KycDraftInput => ({
  document: { type: 'passport', documentNumber },
});

async function drainToTerminal(): Promise<KycApplication> {
  let app = await pollKycStatus();
  while (app.status === 'submitted') {
    app = await pollKycStatus();
  }
  return app;
}

beforeEach(async () => {
  await __reset();
});

describe('fetchKycApplication', () => {
  it('returns a fresh not_started application when nothing is stored', async () => {
    const app = await fetchKycApplication();
    expect(app.status).toBe('not_started');
    expect(app.currentStep).toBe('personal_info');
  });

  it('returns a deep copy callers cannot use to mutate server state', async () => {
    const a = await fetchKycApplication();
    a.status = 'approved';
    const b = await fetchKycApplication();
    expect(b.status).toBe('not_started');
  });
});

describe('saveKycDraft', () => {
  it('persists the draft and mirrors it to AsyncStorage', async () => {
    await saveKycDraft({ currentStep: 'address', ...DOC('AB123') });
    const app = await fetchKycApplication();
    expect(app.status).toBe('draft');
    expect(app.currentStep).toBe('address');

    const raw = await AsyncStorage.getItem('kyc:fake-server');
    expect(raw).toContain('"status":"draft"');
  });

  it('refuses to overwrite a service-owned application with CONFLICT', async () => {
    await saveKycDraft(DOC('AB123'));
    await submitKycApplication();
    await expect(saveKycDraft(DOC('ZZ999'))).rejects.toMatchObject({
      code: ERROR_CODES.CONFLICT,
    });
  });
});

describe('submitKycApplication', () => {
  it('moves a draft to submitted and onto the status step', async () => {
    await saveKycDraft(DOC('AB123'));
    const app = await submitKycApplication();
    expect(app.status).toBe('submitted');
    expect(app.currentStep).toBe('status');
  });

  it('is idempotent while in flight (concurrent calls share one promise)', async () => {
    await saveKycDraft(DOC('AB123'));
    const [a, b] = await Promise.all([
      submitKycApplication(),
      submitKycApplication(),
    ]);
    expect(a).toEqual(b);
    expect(__peek()?.submitAttempts).toBe(1);
  });

  it('rejects re-submission of an already submitted application with CONFLICT', async () => {
    await saveKycDraft(DOC('AB123'));
    await submitKycApplication();
    await expect(submitKycApplication()).rejects.toBeInstanceOf(KycServiceError);
    await expect(submitKycApplication()).rejects.toMatchObject({
      code: ERROR_CODES.CONFLICT,
    });
  });

  it('NETWORK trigger fails the first submit then succeeds on retry', async () => {
    await saveKycDraft(DOC(TRIGGER_DOCUMENTS.NETWORK));

    await expect(submitKycApplication()).rejects.toMatchObject({
      code: ERROR_CODES.NETWORK_ERROR,
    });
    // Application did not advance on the network failure.
    expect((await fetchKycApplication()).status).toBe('draft');

    const app = await submitKycApplication();
    expect(app.status).toBe('submitted');
  });
});

describe('pollKycStatus', () => {
  it('approves a normal document after exactly two polls', async () => {
    await saveKycDraft(DOC('AB123'));
    await submitKycApplication();

    const first = await pollKycStatus();
    expect(first.status).toBe('submitted');
    const second = await pollKycStatus();
    expect(second.status).toBe('approved');
  });

  it('rejects when the REJECT trigger document is used', async () => {
    await saveKycDraft(DOC(TRIGGER_DOCUMENTS.REJECT));
    await submitKycApplication();
    const app = await drainToTerminal();
    expect(app.status).toBe('rejected');
    expect(app.rejectionReason).toBeDefined();
  });

  it('requires more info when the MORE_INFO trigger document is used', async () => {
    await saveKycDraft(DOC(TRIGGER_DOCUMENTS.MORE_INFO));
    await submitKycApplication();
    const app = await drainToTerminal();
    expect(app.status).toBe('requires_more_info');
    expect(app.requiredFields).toEqual([
      'document.type',
      'document.documentNumber',
    ]);
  });

  it('is a no-op when nothing has been submitted', async () => {
    const app = await pollKycStatus();
    expect(app.status).toBe('not_started');
  });
});

describe('__reset', () => {
  it('clears module state and the AsyncStorage mirror', async () => {
    await saveKycDraft(DOC('AB123'));
    await __reset();
    expect(__peek()).toBeNull();
    expect(await AsyncStorage.getItem('kyc:fake-server')).toBeNull();
  });
});
