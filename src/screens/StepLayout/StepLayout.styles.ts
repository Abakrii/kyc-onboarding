// StyleSheet for StepLayout — lives outside the component, built from theme
// tokens. The only values applied inline in the component are the runtime
// safe-area insets.

import { StyleSheet } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../components/theme';

export const stepLayoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  messages: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  messageText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  banner: {
    borderColor: colors.primary,
  },
  bannerText: {
    color: colors.primary,
  },
  dismiss: {
    paddingHorizontal: spacing.xs,
  },
  dismissText: {
    fontSize: fontSize.md,
    color: colors.muted,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
