// PersonalInfoScreen — the first wizard step. Legal name / date of birth /
// nationality are wired to `editField` (whole-section patches), with a Next
// footer. Declarative: it holds only local "have we revealed errors yet" UI
// state; all validation comes from the hook's `errors` (the validator with the
// clock supplied by the one side-effecting hook).

import { useState } from 'react';
import { View } from 'react-native';

import { Button, TextField, WizardHeader } from '../../components';
import { useKycContext } from '../../context/kycProvider';
import type { PersonalInfo } from '../../state/kycTypes';
import type { KycRequiredField } from '../../types/kyc';
import { StepLayout } from '../StepLayout';
import { personalInfoScreenStyles as s } from './PersonalInfoScreen.styles';

export function PersonalInfoScreen() {
  const { state, errors, editField, next, goToStep, dismissBanner, retry } =
    useKycContext();
  const [showErrors, setShowErrors] = useState(false);

  const current = state.draft.personalInfo;

  // editField replaces the whole personalInfo section, so merge the patch over
  // the current values (defaulting missing fields to empty strings).
  const setPersonal = (patch: Partial<PersonalInfo>): void => {
    editField({
      personalInfo: {
        legalName: current?.legalName ?? '',
        dateOfBirth: current?.dateOfBirth ?? '',
        nationality: current?.nationality ?? '',
        ...patch,
      },
    });
  };

  const errorFor = (field: KycRequiredField): string | undefined =>
    showErrors ? errors.find((e) => e.field === field)?.message : undefined;

  // The reducer only blocks blank fields; the validator additionally enforces the
  // date-of-birth rules, so gate Next on the validator here.
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
      onRetry={retry}
      onDismissBanner={dismissBanner}
      footer={
        <View style={s.footerButton}>
          <Button testID="personal-next" label="Next" onPress={handleNext} />
        </View>
      }
    >
      <TextField
        label="Legal name"
        value={current?.legalName ?? ''}
        onChangeText={(text) => setPersonal({ legalName: text })}
        autoCapitalize="words"
        error={errorFor('personalInfo.legalName')}
      />
      <TextField
        label="Date of birth"
        value={current?.dateOfBirth ?? ''}
        onChangeText={(text) => setPersonal({ dateOfBirth: text })}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numbers-and-punctuation"
        error={errorFor('personalInfo.dateOfBirth')}
      />
      <TextField
        label="Nationality"
        value={current?.nationality ?? ''}
        onChangeText={(text) => setPersonal({ nationality: text })}
        autoCapitalize="words"
        error={errorFor('personalInfo.nationality')}
      />
    </StepLayout>
  );
}
