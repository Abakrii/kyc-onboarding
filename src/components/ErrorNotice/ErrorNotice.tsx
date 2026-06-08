// ErrorNotice — a declarative error banner with an optional Retry action. Used by
// StepLayout to surface the `error` axis. No effects: it just renders the message
// and forwards the retry press to its caller (the hook's `retry`).

import { Text, View } from 'react-native';

import { Button } from '../Button';
import { errorNoticeStyles as s } from './ErrorNotice.styles';

export interface ErrorNoticeProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  return (
    <View style={s.container} accessibilityRole="alert">
      <Text style={s.message}>{message}</Text>
      {onRetry ? (
        <View style={s.action}>
          <Button testID="error-retry" label="Retry" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
