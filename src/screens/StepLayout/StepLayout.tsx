// StepLayout — the shared chrome for every wizard step: a header slot (e.g. the
// WizardHeader stepper), a banner/error message region, a scrollable body, and a
// footer slot (e.g. Back / Next buttons). Declarative: it lays out the slots and
// surfaces the banner/error strings, with the only side input being the
// safe-area insets it reads to pad around the notch and home indicator.

import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorNotice } from '../../components';
import { spacing } from '../../components/theme';
import { stepLayoutStyles as s } from './StepLayout.styles';

export interface StepLayoutProps {
  /** Header region (e.g. the WizardHeader stepper). */
  header?: ReactNode;
  /** Informational message (e.g. state.banner). Dismissible when onDismissBanner is set. */
  banner?: string | null;
  /** Error message (e.g. state.error). Rendered above the banner. */
  error?: string | null;
  /** When set, the error renders with a Retry action that calls this. */
  onRetry?: () => void;
  /** Called when the banner's dismiss control is pressed. */
  onDismissBanner?: () => void;
  /** Footer region pinned below the body (e.g. navigation buttons). */
  footer?: ReactNode;
  /** The scrollable step body. */
  children: ReactNode;
}

export function StepLayout({
  header,
  banner,
  error,
  onRetry,
  onDismissBanner,
  footer,
  children,
}: StepLayoutProps) {
  const insets = useSafeAreaInsets();
  const hasMessages = Boolean(error) || Boolean(banner);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {header ? <View style={s.header}>{header}</View> : null}

      {hasMessages ? (
        <View style={s.messages}>
          {error ? <ErrorNotice message={error} onRetry={onRetry} /> : null}
          {banner ? (
            <View style={[s.message, s.banner]} accessibilityRole="alert">
              <Text style={[s.messageText, s.bannerText]}>{banner}</Text>
              {onDismissBanner ? (
                <Pressable
                  style={s.dismiss}
                  hitSlop={8}
                  onPress={onDismissBanner}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss message"
                >
                  <Text style={s.dismissText}>✕</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {footer ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
