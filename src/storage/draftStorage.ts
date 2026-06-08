// Versioned, error-tolerant local persistence for the in-progress KYC draft.
//
// This stores ONLY the draft the user is editing — never the service-owned
// fields (id, status, rejectionReason, requiredFields, updatedAt). It is the
// client's resume cache and is intentionally separate from the fake service's
// own AsyncStorage mirror (different key, different concern).
//
// ─── PRODUCTION SECURITY / KEYCHAIN HARDENING ───────────────────────────────
// AsyncStorage is plaintext and unencrypted: readable on a rooted/jailbroken
// device and captured in unencrypted device backups. A KYC draft is PII (legal
// name, date of birth, nationality, address, document number) and MUST NOT live
// here in production. Move it to the OS secure enclave — `expo-secure-store`,
// backed by the iOS Keychain and the Android Keystore — so values are encrypted
// at rest and excluded from backups. When migrating:
//   • expo-secure-store has a ~2KB per-item limit on iOS. If the draft can grow
//     past that, generate a data key in SecureStore and keep only AES-encrypted
//     ciphertext in AsyncStorage.
//   • Gate reads behind device auth (the `requireAuthentication` option) where
//     the UX allows it.
//   • Clear the draft on logout and on successful submission.
// We also never log the draft or caught errors here — both can echo PII.

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { KycDraft } from '../types/kyc';

// Re-exported for callers that import the draft shape from the storage module.
// The canonical definition lives in the types core. Distinct from the service's
// KycDraftInput (a partial patch): KycDraft is the full resumable snapshot,
// including the wizard position the user left off at.
export type { KycDraft };

const STORAGE_KEY = 'kyc:draft';

// Bump whenever KycDraft's shape changes; payloads written under a different
// version are discarded on load rather than fed to newer code.
export const DRAFT_VERSION = 1;

interface VersionedDraft {
  version: number;
  draft: KycDraft;
}

export async function loadDraft(): Promise<KycDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<VersionedDraft>;
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      parsed.version !== DRAFT_VERSION ||
      typeof parsed.draft !== 'object' ||
      parsed.draft === null
    ) {
      // Missing field, corrupt, or written by an older/newer schema. Drop it so
      // we don't keep tripping over it, and report "no draft".
      await clearDraft();
      return null;
    }

    return parsed.draft;
  } catch {
    // Error-tolerant: any read/parse failure simply means "no draft".
    return null;
  }
}

export async function saveDraft(draft: KycDraft): Promise<void> {
  try {
    const payload: VersionedDraft = { version: DRAFT_VERSION, draft };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Error-tolerant: a failed save is non-fatal — the user keeps editing and
    // the next save can succeed. Intentionally silent (the payload is PII).
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Error-tolerant: best-effort removal.
  }
}
