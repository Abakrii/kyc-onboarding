// Design tokens. Plain values only — no React, no StyleSheet. The sibling
// *.styles.ts files build StyleSheet objects from these so spacing, colour and
// type scale stay defined in exactly one place.

export const colors = {
  primary: '#2563eb',
  primaryText: '#ffffff',
  secondary: '#e5e7eb',
  secondaryText: '#111827',
  text: '#111827',
  muted: '#6b7280',
  border: '#d1d5db',
  error: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  background: '#ffffff',
  disabled: '#9ca3af',
  disabledBackground: '#e5e7eb',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
} as const;

export const fontSize = {
  sm: 13,
  md: 15,
  lg: 17,
} as const;

// `as const` keeps these as the string-literal weights TextStyle['fontWeight']
// expects (e.g. '600'), not a widened `string`.
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
} as const;
