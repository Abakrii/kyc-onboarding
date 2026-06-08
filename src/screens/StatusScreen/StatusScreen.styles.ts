// StyleSheet for StatusScreen — built from theme tokens.

import { StyleSheet } from 'react-native';

import { colors, fontSize, spacing } from '../../components/theme';

export const statusScreenStyles = StyleSheet.create({
  block: {
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  footerButton: {
    flex: 1,
  },
});
