// StyleSheet for Button — lives outside the component, built from theme tokens.
// No inline styles in Button.tsx; it composes these named entries.

import { StyleSheet } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '../theme';

export const buttonStyles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    backgroundColor: colors.disabledBackground,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  primaryLabel: {
    color: colors.primaryText,
  },
  secondaryLabel: {
    color: colors.secondaryText,
  },
  disabledLabel: {
    color: colors.disabled,
  },
});
