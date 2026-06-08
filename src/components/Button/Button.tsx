// Declarative button. No effects, no logic beyond deriving styles/state from
// props. Styles come from Button.styles.ts (no inline style objects here).

import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '../theme';
import { buttonStyles as s } from './Button.styles';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  // A loading button is non-interactive too, so it can't be double-submitted.
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.base,
        isPrimary ? s.primary : s.secondary,
        pressed && !isDisabled && s.pressed,
        isDisabled && s.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-spinner"
          color={isPrimary ? colors.primaryText : colors.secondaryText}
        />
      ) : (
        <Text
          style={[
            s.label,
            isPrimary ? s.primaryLabel : s.secondaryLabel,
            isDisabled && s.disabledLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
