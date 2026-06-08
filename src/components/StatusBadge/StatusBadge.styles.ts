// StyleSheet for StatusBadge — built from theme tokens.

import { StyleSheet } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

export const statusBadgeStyles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryText,
  },
  neutral: { backgroundColor: colors.muted },
  info: { backgroundColor: colors.primary },
  warning: { backgroundColor: colors.warning },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.error },
});
