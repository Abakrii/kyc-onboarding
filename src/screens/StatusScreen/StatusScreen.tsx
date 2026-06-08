// StatusScreen — the final wizard step, shown once the application is in the
// service's hands. It surfaces the remote outcome: a status badge, an in-review
// spinner while polling, the approved/rejected message, a Start-over action on
// terminal states, and (via StepLayout's ErrorNotice) a Retry on errors. The
// stepper's status node is tinted to match the outcome.

import { ActivityIndicator, Text, View } from 'react-native';

import { Button, StatusBadge, WizardHeader, statusTone } from '../../components';
import { colors } from '../../components/theme';
import { useKycContext } from '../../context/kycProvider';
import { isTerminal } from '../../types/kyc';
import { StepLayout } from '../StepLayout';
import { statusScreenStyles as s } from './StatusScreen.styles';

export function StatusScreen() {
  const { state, reset, retry } = useKycContext();
  const { remoteStatus, uiPhase, rejectionReason } = state;

  const inReview = remoteStatus === 'submitted' && uiPhase !== 'error';
  const terminal = isTerminal(remoteStatus);

  return (
    <StepLayout
      header={<WizardHeader currentStep="status" statusTone={statusTone(remoteStatus)} />}
      banner={state.banner}
      error={state.error}
      onRetry={retry}
      onDismissBanner={undefined}
      footer={
        terminal ? (
          <View style={s.footerButton}>
            <Button testID="status-start-over" label="Start over" onPress={reset} />
          </View>
        ) : undefined
      }
    >
      <StatusBadge status={remoteStatus} />

      {inReview ? (
        <View style={s.block}>
          <ActivityIndicator testID="status-spinner" color={colors.primary} />
          <Text style={s.message}>
            We’re reviewing your application. This won’t take long.
          </Text>
        </View>
      ) : null}

      {remoteStatus === 'approved' ? (
        <Text style={s.message}>Your identity has been verified — you’re all set.</Text>
      ) : null}

      {remoteStatus === 'rejected' ? (
        <Text style={s.message}>
          {rejectionReason ?? 'Your application could not be approved.'}
        </Text>
      ) : null}
    </StepLayout>
  );
}
