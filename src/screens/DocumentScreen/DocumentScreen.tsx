// DocumentScreen — the third wizard step. A pill selector for the document type
// (OptionGroup) plus a document-number field, both wired to `editField`. A hint
// lists the magic document numbers the fake service recognises. Same validation
// pattern as the other steps (inline errors gated by a Next attempt).

import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  Button,
  OptionGroup,
  TextField,
  WizardHeader,
  type OptionGroupOption,
} from '../../components';
import { useKycContext } from '../../context/kycProvider';
import type { DocumentInfo } from '../../state/kycTypes';
import type { KycRequiredField } from '../../types/kyc';
import { StepLayout } from '../StepLayout';
import { documentScreenStyles as s } from './DocumentScreen.styles';

type DocumentType = DocumentInfo['type'];

// Friendly labels for each document type. Exported so ReviewScreen can render the
// same label for a stored type.
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  national_id: 'National ID',
  drivers_license: 'Driver’s license',
};

const DOCUMENT_TYPE_OPTIONS: OptionGroupOption<DocumentType>[] = [
  { value: 'passport', label: DOCUMENT_TYPE_LABELS.passport },
  { value: 'national_id', label: DOCUMENT_TYPE_LABELS.national_id },
  { value: 'drivers_license', label: DOCUMENT_TYPE_LABELS.drivers_license },
];

export function DocumentScreen() {
  const { state, errors, editField, next, prev, goToStep, dismissBanner, retry } =
    useKycContext();
  const [showErrors, setShowErrors] = useState(false);

  const current = state.draft.document;

  // editField replaces the whole document section. `type` is required by the
  // shape, so default it to 'passport' when only the number has been entered.
  const setDocument = (patch: Partial<DocumentInfo>): void => {
    editField({
      document: {
        type: current?.type ?? 'passport',
        documentNumber: current?.documentNumber ?? '',
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
      onRetry={retry}
      onDismissBanner={dismissBanner}
      footer={
        <>
          <View style={s.footerButton}>
            <Button
              testID="document-back"
              label="Back"
              variant="secondary"
              onPress={prev}
            />
          </View>
          <View style={s.footerButton}>
            <Button testID="document-next" label="Next" onPress={handleNext} />
          </View>
        </>
      }
    >
      <OptionGroup
        label="Document type"
        options={DOCUMENT_TYPE_OPTIONS}
        value={current?.type}
        onChange={(type) => setDocument({ type })}
        error={errorFor('document.type')}
      />
      <TextField
        label="Document number"
        value={current?.documentNumber ?? ''}
        onChangeText={(text) => setDocument({ documentNumber: text })}
        autoCapitalize="characters"
        autoCorrect={false}
        error={errorFor('document.documentNumber')}
      />
      {/* Mirrors TRIGGER_DOCUMENTS in the fake service. */}
      <Text style={s.hint}>
        Testing tip: enter MOREINFO, REJECT, or NETWORK as the document number to
        simulate a request for more info, a rejection, or a one-time network
        failure on submit.
      </Text>
    </StepLayout>
  );
}
