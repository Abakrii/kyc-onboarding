// bootstrap.ts — pure: turn (local draft, server application) into the plan the
// hook hydrates from: a reconciled application plus the wizard step to resume on.
// No I/O, no clock.

import {
  isServiceOwned,
  type KycApplication,
  type KycDraft,
  type KycStep,
} from '../types/kyc';
import { reconcile } from './conflicts';
import { firstStepForRequiredFields } from './selectore';

export interface BootstrapPlan {
  application: KycApplication;
  banner: string | null;
}

// Where to drop the user back in:
//  - service-owned (submitted/approved/rejected) → the status screen
//  - requires_more_info → the first step that still owns a required field
//  - editable draft/not_started → where they left off (local), else the server's
function resumeStep(application: KycApplication, local: KycDraft | null): KycStep {
  if (isServiceOwned(application.status)) {
    return 'status';
  }
  if (application.status === 'requires_more_info') {
    return (
      firstStepForRequiredFields(application.requiredFields ?? []) ?? 'personal_info'
    );
  }
  return local?.currentStep ?? application.currentStep;
}

export function computeBootstrap(
  local: KycDraft | null,
  remote: KycApplication
): BootstrapPlan {
  const { application, banner } = reconcile(local, remote);
  return {
    application: { ...application, currentStep: resumeStep(application, local) },
    banner,
  };
}
