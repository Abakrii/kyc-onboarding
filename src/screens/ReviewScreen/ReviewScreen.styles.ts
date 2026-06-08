// StyleSheet for ReviewScreen — built from theme tokens.

import { StyleSheet } from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '../../components/theme';

export const reviewScreenStyles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  editLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  rowValue: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'right',
  },
  // Lets the two footer buttons share the row evenly (Button owns no width).
  footerButton: {
    flex: 1,
  },
});
