// StyleSheet for DocumentScreen — built from theme tokens.

import { StyleSheet } from 'react-native';

import { colors, fontSize } from '../../components/theme';

export const documentScreenStyles = StyleSheet.create({
  hint: {
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 18,
  },
  // Lets the two footer buttons share the row evenly (Button owns no width).
  footerButton: {
    flex: 1,
  },
});
