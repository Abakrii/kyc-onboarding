// OptionGroup — a single-select row of pills. Declarative and generic over the
// value type (e.g. a document-type union), so callers stay type-safe. Mirrors
// TextField's shape: an optional label above and an optional error below.

import { Pressable, Text, View } from 'react-native';

import { optionGroupStyles as s } from './OptionGroup.styles';

export interface OptionGroupOption<T extends string> {
  value: T;
  label: string;
}

export interface OptionGroupProps<T extends string> {
  options: readonly OptionGroupOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  label?: string;
  error?: string;
}

export function OptionGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  error,
}: OptionGroupProps<T>) {
  return (
    <View style={s.container}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={s.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={[s.pill, selected && s.pillSelected]}
            >
              <Text style={[s.pillText, selected && s.pillTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}
