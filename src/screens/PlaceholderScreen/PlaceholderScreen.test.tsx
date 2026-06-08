import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

// The provider exports KycContext precisely so screens can be tested under a
// stubbed value — no real hook, no bootstrap, fully synchronous.
import { KycContext } from '../../context/kycProvider';
import type { KycContextValue } from '../../hooks/useKyc';
import { createInitialState } from '../../state/kycTypes';
import { PlaceholderScreen } from './PlaceholderScreen';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function makeValue(overrides: Partial<KycContextValue> = {}): KycContextValue {
  return {
    state: createInitialState(),
    editField: jest.fn(),
    next: jest.fn(),
    prev: jest.fn(),
    goToStep: jest.fn(),
    submit: jest.fn(),
    retry: jest.fn(),
    reset: jest.fn(),
    dismissBanner: jest.fn(),
    ...overrides,
  };
}

function renderWith(value: KycContextValue): void {
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <KycContext.Provider value={value}>
        <PlaceholderScreen />
      </KycContext.Provider>
    </SafeAreaProvider>
  );
}

describe('PlaceholderScreen', () => {
  it('renders the current step title and a coming-soon placeholder', () => {
    renderWith(makeValue());

    expect(screen.getByText('Personal information')).toBeTruthy();
    expect(screen.getByText(/hasn.t been built yet/)).toBeTruthy();
  });

  it('disables Back on the first step and wires Next to next()', () => {
    const next = jest.fn();
    renderWith(makeValue({ next }));

    expect(
      screen.getByTestId('placeholder-back').props.accessibilityState.disabled
    ).toBe(true);

    fireEvent.press(screen.getByTestId('placeholder-next'));
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('surfaces the banner and dismisses it', () => {
    const dismissBanner = jest.fn();
    renderWith(
      makeValue({
        state: { ...createInitialState(), banner: 'Heads up' },
        dismissBanner,
      })
    );

    expect(screen.getByText('Heads up')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Dismiss message'));
    expect(dismissBanner).toHaveBeenCalledTimes(1);
  });
});
