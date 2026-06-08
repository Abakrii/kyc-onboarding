// StatusBadge — a coloured pill for the remoteStatus axis. Declarative. The
// status→tone mapping is exported so the WizardHeader can tint its status node
// with the same semantics.

import { Text, View } from 'react-native';

import type { KycStatus } from '../../types/kyc';
import { statusBadgeStyles as s } from './StatusBadge.styles';

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const STATUS_LABEL: Record<KycStatus, string> = {
  not_started: 'Not started',
  draft: 'Draft',
  submitted: 'In review',
  requires_more_info: 'More info needed',
  approved: 'Approved',
  rejected: 'Rejected',
};

const STATUS_TONE: Record<KycStatus, Tone> = {
  not_started: 'neutral',
  draft: 'neutral',
  submitted: 'info',
  requires_more_info: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export function statusTone(status: KycStatus): Tone {
  return STATUS_TONE[status];
}

export interface StatusBadgeProps {
  status: KycStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const tone = STATUS_TONE[status];
  const toneStyle =
    tone === 'info'
      ? s.info
      : tone === 'warning'
        ? s.warning
        : tone === 'success'
          ? s.success
          : tone === 'danger'
            ? s.danger
            : s.neutral;

  return (
    <View
      style={[s.badge, toneStyle]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${STATUS_LABEL[status]}`}
    >
      <Text style={s.label}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}
