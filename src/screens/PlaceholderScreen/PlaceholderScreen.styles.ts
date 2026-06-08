// StyleSheet for PlaceholderScreen — built from theme tokens. No inline styles in
// the component.

import { StyleSheet } from 'react-native';

import { colors, fontSize, fontWeight } from '../../components/theme';

export const placeholderScreenStyles = StyleSheet.create({
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  body: {
    fontSize: fontSize.md,
    color: colors.muted,
  },
  // Lets the two footer buttons share the row evenly (Button owns no width).
  footerButton: {
    flex: 1,
  },
});
