import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { StepLayout } from './StepLayout';

// Seed the provider with fixed metrics so useSafeAreaInsets resolves
// synchronously (no onLayout) in the test renderer.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderInSafeArea(ui: ReactElement): void {
  render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);
}

describe('StepLayout', () => {
  it('renders the body children', () => {
    renderInSafeArea(
      <StepLayout>
        <Text>Body content</Text>
      </StepLayout>
    );
    expect(screen.getByText('Body content')).toBeTruthy();
  });

  it('renders the header and footer slots', () => {
    renderInSafeArea(
      <StepLayout header={<Text>Header</Text>} footer={<Text>Footer</Text>}>
        <Text>Body</Text>
      </StepLayout>
    );
    expect(screen.getByText('Header')).toBeTruthy();
    expect(screen.getByText('Footer')).toBeTruthy();
  });

  it('renders both the error and banner messages', () => {
    renderInSafeArea(
      <StepLayout error="Something failed" banner="Heads up">
        <Text>Body</Text>
      </StepLayout>
    );
    expect(screen.getByText('Something failed')).toBeTruthy();
    expect(screen.getByText('Heads up')).toBeTruthy();
  });

  it('dismisses the banner via the dismiss control', () => {
    const onDismissBanner = jest.fn();
    renderInSafeArea(
      <StepLayout banner="Heads up" onDismissBanner={onDismissBanner}>
        <Text>Body</Text>
      </StepLayout>
    );

    fireEvent.press(screen.getByLabelText('Dismiss message'));

    expect(onDismissBanner).toHaveBeenCalledTimes(1);
  });

  it('omits the dismiss control when no handler is given', () => {
    renderInSafeArea(
      <StepLayout banner="Heads up">
        <Text>Body</Text>
      </StepLayout>
    );
    expect(screen.queryByLabelText('Dismiss message')).toBeNull();
  });
});
