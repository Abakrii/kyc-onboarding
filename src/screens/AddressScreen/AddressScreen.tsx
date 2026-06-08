// AddressScreen — the second wizard step. Country / city / line 1 are wired to
// `editField` (whole-section patches), with Back and Next in the footer. Same
// pattern as PersonalInfoScreen: validation comes from the hook's `errors`; the
// only local state is whether errors have been revealed.

import { useState } from 'react';
import { View } from 'react-native';

import { Button, TextField, WizardHeader } from '../../components';
import { useKycContext } from '../../context/kycProvider';
import type { AddressInfo } from '../../state/kycTypes';
import type { KycRequiredField } from '../../types/kyc';
import { StepLayout } from '../StepLayout';
import { addressScreenStyles as s } from './AddressScreen.styles';

export function AddressScreen() {
  const { state, errors, editField, next, prev, goToStep, dismissBanner } =
    useKycContext();
  const [showErrors, setShowErrors] = useState(false);

  const current = state.draft.address;

  // editField replaces the whole address section, so merge the patch over the
  // current values (defaulting missing fields to empty strings).
  const setAddress = (patch: Partial<AddressInfo>): void => {
    editField({
      address: {
        country: current?.country ?? '',
        city: current?.city ?? '',
        line1: current?.line1 ?? '',
        ...patch,
      },
    });
  };

  const errorFor = (field: KycRequiredField): string | undefined =>
    showErrors ? errors.find((e) => e.field === field)?.message : undefined;

  const handleNext = (): void => {
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    next();
  };

  return (
    <StepLayout
      header={
        <WizardHeader currentStep={state.draft.currentStep} onStepPress={goToStep} />
      }
      banner={state.banner}
      error={state.error}
      onDismissBanner={dismissBanner}
      footer={
        <>
          <View style={s.footerButton}>
            <Button
              testID="address-back"
              label="Back"
              variant="secondary"
              onPress={prev}
            />
          </View>
          <View style={s.footerButton}>
            <Button testID="address-next" label="Next" onPress={handleNext} />
          </View>
        </>
      }
    >
      <TextField
        label="Country"
        value={current?.country ?? ''}
        onChangeText={(text) => setAddress({ country: text })}
        autoCapitalize="words"
        error={errorFor('address.country')}
      />
      <TextField
        label="City"
        value={current?.city ?? ''}
        onChangeText={(text) => setAddress({ city: text })}
        autoCapitalize="words"
        error={errorFor('address.city')}
      />
      <TextField
        label="Address line 1"
        value={current?.line1 ?? ''}
        onChangeText={(text) => setAddress({ line1: text })}
        autoCapitalize="words"
        error={errorFor('address.line1')}
      />
    </StepLayout>
  );
}
