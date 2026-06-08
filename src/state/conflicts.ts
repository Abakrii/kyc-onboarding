// conflicts.ts — pure reconciliation of the locally-cached draft against the
// server's application at bootstrap. No I/O, no clock. Decides which copy's data
// wins and whether to warn the user; the resume STEP is computed in bootstrap.ts.

import {
  isServiceOwned,
  type KycApplication,
  type KycDraft,
} from '../types/kyc';

export const DISCARDED_EDITS_BANNER =
  'Your application is already being processed, so unsaved changes on this device were discarded.';

const SECTIONS = ['personalInfo', 'address', 'document'] as const;

export interface ReconcileResult {
  /** The application to hydrate from (server, or server with local edits merged). */
  application: KycApplication;
  /** A banner to surface (discarded edits), or null. */
  banner: string | null;
}

// True when the local draft carries any editable section.
function hasData(local: KycDraft | null): local is KycDraft {
  return local !== null && SECTIONS.some((section) => local[section] !== undefined);
}

// True when the local draft holds a section that differs from the server's copy
// — i.e. genuinely unsynced edits (not just a mirror of what was submitted).
function hasUnsyncedEdits(local: KycDraft | null, remote: KycApplication): boolean {
  if (!hasData(local)) {
    return false;
  }
  return SECTIONS.some(
    (section) =>
      local[section] !== undefined &&
      JSON.stringify(local[section]) !== JSON.stringify(remote[section])
  );
}

// Server application with the local sections layered on top (local edits win).
function mergeSections(local: KycDraft, remote: KycApplication): KycApplication {
  return {
    ...remote,
    ...(local.personalInfo ? { personalInfo: local.personalInfo } : {}),
    ...(local.address ? { address: local.address } : {}),
    ...(local.document ? { document: local.document } : {}),
  };
}

export function reconcile(
  local: KycDraft | null,
  remote: KycApplication
): ReconcileResult {
  // Service-owned (submitted / approved / rejected): the server wins outright.
  // Warn only if the device held edits that never reached the server.
  if (isServiceOwned(remote.status)) {
    return {
      application: remote,
      banner: hasUnsyncedEdits(local, remote) ? DISCARDED_EDITS_BANNER : null,
    };
  }

  // Editable (draft / not_started / requires_more_info): keep the device's
  // in-progress edits when it holds any; otherwise the server copy stands.
  return {
    application: hasData(local) ? mergeSections(local, remote) : remote,
    banner: null,
  };
}
