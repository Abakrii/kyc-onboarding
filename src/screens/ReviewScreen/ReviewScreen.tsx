// ReviewScreen — the fourth wizard step. A read-only summary of each section with
// an Edit link (goToStep) back to it, a Submit button (disabled while the save /
// submit is in flight), and a Back button. Submission itself is driven by the
// hook's `submit`, which validates the whole application first.

import { Pressable, Text, View } from 'react-native';

import { Button, WizardHeader } from '../../components';
import { useKycContext } from '../../context/kycProvider';
import type { KycStep } from '../../types/kyc';
import { FIELD_LABEL } from '../../validation/validator';
import { DOCUMENT_TYPE_LABELS } from '../DocumentScreen/DocumentScreen';
import { StepLayout } from '../StepLayout';
import { reviewScreenStyles as s } from './ReviewScreen.styles';

interface SummaryRow {
  label: string;
  value: string | undefined;
}

interface SummarySection {
  step: KycStep;
  title: string;
  rows: SummaryRow[];
}

export function ReviewScreen() {
  const { state, submit, prev, goToStep, dismissBanner, retry } = useKycContext();
  const { personalInfo, address, document } = state.draft;
  const isBusy = state.uiPhase === 'saving' || state.uiPhase === 'submitting';

  const sections: SummarySection[] = [
    {
      step: 'personal_info',
      title: 'Personal information',
      rows: [
        { label: FIELD_LABEL['personalInfo.legalName'], value: personalInfo?.legalName },
        { label: FIELD_LABEL['personalInfo.dateOfBirth'], value: personalInfo?.dateOfBirth },
        { label: FIELD_LABEL['personalInfo.nationality'], value: personalInfo?.nationality },
      ],
    },
    {
      step: 'address',
      title: 'Address',
      rows: [
        { label: FIELD_LABEL['address.country'], value: address?.country },
        { label: FIELD_LABEL['address.city'], value: address?.city },
        { label: FIELD_LABEL['address.line1'], value: address?.line1 },
      ],
    },
    {
      step: 'document',
      title: 'Document',
      rows: [
        {
          label: FIELD_LABEL['document.type'],
          value: document ? DOCUMENT_TYPE_LABELS[document.type] : undefined,
        },
        { label: FIELD_LABEL['document.documentNumber'], value: document?.documentNumber },
      ],
    },
  ];

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
              testID="review-back"
              label="Back"
              variant="secondary"
              onPress={prev}
            />
          </View>
          <View style={s.footerButton}>
            <Button
              testID="review-submit"
              label="Submit"
              onPress={submit}
              loading={isBusy}
            />
          </View>
        </>
      }
    >
      {sections.map((section) => (
        <View key={section.step} style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Pressable
              testID={`review-edit-${section.step}`}
              onPress={() => goToStep(section.step)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${section.title}`}
              hitSlop={8}
            >
              <Text style={s.editLink}>Edit</Text>
            </Pressable>
          </View>
          {section.rows.map((row) => (
            <View key={row.label} style={s.row}>
              <Text style={s.rowLabel}>{row.label}</Text>
              <Text style={s.rowValue}>
                {row.value && row.value.trim() ? row.value : '—'}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </StepLayout>
  );
}
