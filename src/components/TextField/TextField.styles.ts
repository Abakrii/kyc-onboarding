// StyleSheet for TextField — lives outside the component, built from theme
// tokens. No inline styles in TextField.tsx; it composes these named entries.

import { StyleSheet } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

export const textFieldStyles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.disabledBackground,
    color: colors.disabled,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
});
