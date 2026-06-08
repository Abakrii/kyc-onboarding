// PlaceholderScreen — a stand-in for any wizard step that hasn't been built yet.
// It wires up the real chrome (StepLayout + WizardHeader + Back/Next footer)
// around a "coming soon" body, so the whole flow is navigable while individual
// step screens are still in progress. The Router swaps each case out for its real
// screen as it lands.

import { Text, View } from 'react-native';

import { Button, WizardHeader } from '../../components';
import { useKycContext } from '../../context/kycProvider';
import { WIZARD_STEPS, type KycStep } from '../../types/kyc';
import { StepLayout } from '../StepLayout';
import { placeholderScreenStyles as s } from './PlaceholderScreen.styles';

// Human-facing titles per step. Presentation only — canonical ids live in
// WIZARD_STEPS.
const STEP_TITLES: Record<KycStep, string> = {
  personal_info: 'Personal information',
  address: 'Address',
  document: 'Identity document',
  review: 'Review & submit',
  status: 'Verification status',
};

export function PlaceholderScreen() {
  const { state, next, prev, goToStep, dismissBanner } = useKycContext();
  const step = state.draft.currentStep;
  const index = WIZARD_STEPS.indexOf(step);

  return (
    <StepLayout
      header={<WizardHeader currentStep={step} onStepPress={goToStep} />}
      banner={state.banner}
      error={state.error}
      onDismissBanner={dismissBanner}
      footer={
        <>
          <View style={s.footerButton}>
            <Button
              testID="placeholder-back"
              label="Back"
              variant="secondary"
              onPress={prev}
              disabled={index === 0}
            />
          </View>
          <View style={s.footerButton}>
            <Button
              testID="placeholder-next"
              label="Next"
              onPress={next}
              disabled={index === WIZARD_STEPS.length - 1}
            />
          </View>
        </>
      }
    >
      <Text style={s.title}>{STEP_TITLES[step]}</Text>
      <Text style={s.body}>This screen hasn’t been built yet.</Text>
    </StepLayout>
  );
}
