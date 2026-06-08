// StyleSheet for ErrorNotice — built from theme tokens.

import { StyleSheet } from 'react-native';

import { colors, fontSize, radius, spacing } from '../theme';

export const errorNoticeStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  // Keep the Retry button compact (left-aligned) rather than full width.
  action: {
    alignSelf: 'flex-start',
  },
});
