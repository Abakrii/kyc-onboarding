// Declarative labelled text field. Wraps TextInput with a label and optional
// error message. Styles come from TextField.styles.ts (no inline style objects).
//
// `style` and `editable` are removed from the inherited TextInput props: styling
// is owned by this component, and editability is driven by `disabled`.

import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '../theme';
import { textFieldStyles as s } from './TextField.styles';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'editable'> {
  label: string;
  error?: string;
  disabled?: boolean;
}

export function TextField({ label, error, disabled = false, ...rest }: TextFieldProps) {
  const hasError = !!error;

  return (
    <View style={s.container}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...rest}
        editable={!disabled}
        accessibilityState={{ disabled }}
        style={[s.input, hasError && s.inputError, disabled && s.inputDisabled]}
      />
      {hasError ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}
