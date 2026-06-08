// StyleSheet for WizardHeader — lives outside the component, built from theme
// tokens. No inline styles in WizardHeader.tsx; it composes these named entries.

import { StyleSheet } from 'react-native';

import { colors, fontSize, fontWeight, spacing } from '../theme';

const CIRCLE_SIZE = 32;

export const wizardHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
  },
  // One equal-width column per step, so the stepper fills the available width
  // regardless of how many nodes there are.
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  // The circle plus its left/right connector halves, stretched across the cell.
  cellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  connector: {
    flex: 1,
    height: 2,
  },
  connectorActive: {
    backgroundColor: colors.primary,
  },
  connectorIdle: {
    backgroundColor: colors.border,
  },
  // First node's left half / last node's right half: keep the flex slot (so the
  // circle stays centred) but draw nothing.
  connectorHidden: {
    backgroundColor: 'transparent',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleCurrent: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
  },
  circleUpcoming: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  symbol: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  symbolDone: { color: colors.primaryText },
  symbolCurrent: { color: colors.primary },
  symbolUpcoming: { color: colors.muted },
  label: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  labelDone: { color: colors.text },
  labelCurrent: { color: colors.primary, fontWeight: fontWeight.semibold },
  labelUpcoming: { color: colors.muted },
});
