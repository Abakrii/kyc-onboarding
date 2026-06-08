// StyleSheet for Router — built from theme tokens.

import { StyleSheet } from 'react-native';

import { colors } from '../../components/theme';

export const routerStyles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
