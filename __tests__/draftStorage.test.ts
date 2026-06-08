import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DRAFT_VERSION,
  clearDraft,
  loadDraft,
  saveDraft,
  type KycDraft,
} from '../src/storage/draftStorage';

const STORAGE_KEY = 'kyc:draft';

const SAMPLE: KycDraft = {
  currentStep: 'address',
  personalInfo: {
    legalName: 'Test User',
    dateOfBirth: '1990-01-01',
    nationality: 'US',
  },
  address: { country: 'US', city: 'NYC', line1: '1 Main St' },
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('round trip', () => {
  it('returns null when nothing is stored', async () => {
    expect(await loadDraft()).toBeNull();
  });

  it('saves and loads the draft', async () => {
    await saveDraft(SAMPLE);
    expect(await loadDraft()).toEqual(SAMPLE);
  });

  it('persists under a versioned envelope', async () => {
    await saveDraft(SAMPLE);
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(raw ?? 'null')).toEqual({
      version: DRAFT_VERSION,
      draft: SAMPLE,
    });
  });

  it('clears the draft', async () => {
    await saveDraft(SAMPLE);
    await clearDraft();
    expect(await loadDraft()).toBeNull();
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('versioning', () => {
  it('discards and removes a draft from a different version', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: DRAFT_VERSION + 1, draft: SAMPLE })
    );
    expect(await loadDraft()).toBeNull();
    // Stale payload is cleaned up so it can't keep failing.
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('discards a corrupt (non-JSON) payload', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'not json{');
    expect(await loadDraft()).toBeNull();
  });
});

describe('error tolerance', () => {
  it('returns null instead of throwing when the read fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('read failed')
    );
    await expect(loadDraft()).resolves.toBeNull();
  });

  it('does not throw when the write fails', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('write failed')
    );
    await expect(saveDraft(SAMPLE)).resolves.toBeUndefined();
  });

  it('does not throw when the remove fails', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      new Error('remove failed')
    );
    await expect(clearDraft()).resolves.toBeUndefined();
  });
});
