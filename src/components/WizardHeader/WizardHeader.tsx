// WizardHeader — a 5-node stepper over the KYC wizard
// (Personal → Address → Document → Review → Status). Declarative and pure: it
// derives done / current / upcoming purely from `currentStep` against
// WIZARD_STEPS and runs no side effects. The optional `onStepPress` lets a
// parent wire navigation (e.g. GO_TO_STEP); omit it for a read-only header.

import { Pressable, Text, View } from 'react-native';

import { WIZARD_STEPS, type KycStep } from '../../types/kyc';
import { wizardHeaderStyles as s } from './WizardHeader.styles';

export interface WizardHeaderProps {
  /** The step the user is on; drives done / current / upcoming styling. */
  currentStep: KycStep;
  /** Optional tap handler (e.g. to navigate back). Omit for a read-only header. */
  onStepPress?: (step: KycStep) => void;
}

type NodeState = 'done' | 'current' | 'upcoming';

// Short, human-facing labels per step. Presentation only — the canonical ids
// live in WIZARD_STEPS.
const STEP_LABELS: Record<KycStep, string> = {
  personal_info: 'Personal',
  address: 'Address',
  document: 'Document',
  review: 'Review',
  status: 'Status',
};

const LAST_INDEX = WIZARD_STEPS.length - 1;

export function WizardHeader({ currentStep, onStepPress }: WizardHeaderProps) {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep);

  return (
    <View style={s.container}>
      {WIZARD_STEPS.map((step, i) => {
        const state: NodeState =
          i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming';
        // Left half fills once we've reached this node; right half once the node
        // itself is completed. The end caps render nothing.
        const leftStyle =
          i === 0 ? s.connectorHidden : i <= currentIndex ? s.connectorActive : s.connectorIdle;
        const rightStyle =
          i === LAST_INDEX ? s.connectorHidden : i < currentIndex ? s.connectorActive : s.connectorIdle;
        const stateLabel =
          state === 'done'
            ? 'completed'
            : state === 'current'
              ? 'current step'
              : 'not started';

        return (
          <View key={step} style={s.cell}>
            <View style={s.cellRow}>
              <View style={[s.connector, leftStyle]} />
              <Pressable
                hitSlop={8}
                disabled={!onStepPress}
                onPress={onStepPress ? () => onStepPress(step) : undefined}
                accessibilityRole="button"
                accessibilityState={{ selected: state === 'current', disabled: !onStepPress }}
                accessibilityLabel={`${STEP_LABELS[step]}, step ${i + 1} of ${WIZARD_STEPS.length}, ${stateLabel}`}
                style={[
                  s.circle,
                  state === 'done'
                    ? s.circleDone
                    : state === 'current'
                      ? s.circleCurrent
                      : s.circleUpcoming,
                ]}
              >
                <Text
                  style={[
                    s.symbol,
                    state === 'done'
                      ? s.symbolDone
                      : state === 'current'
                        ? s.symbolCurrent
                        : s.symbolUpcoming,
                  ]}
                >
                  {state === 'done' ? '✓' : i + 1}
                </Text>
              </Pressable>
              <View style={[s.connector, rightStyle]} />
            </View>
            <Text
              style={[
                s.label,
                state === 'done'
                  ? s.labelDone
                  : state === 'current'
                    ? s.labelCurrent
                    : s.labelUpcoming,
              ]}
              numberOfLines={1}
            >
              {STEP_LABELS[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
