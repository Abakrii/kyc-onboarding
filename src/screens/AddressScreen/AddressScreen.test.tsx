import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { KycContext } from '../../context/kycProvider';
import type { KycContextValue } from '../../hooks/useKyc';
import { createInitialState } from '../../state/kycTypes';
import { AddressScreen } from './AddressScreen';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function makeValue(overrides: Partial<KycContextValue> = {}): KycContextValue {
  return {
    state: { ...createInitialState(), draft: { currentStep: 'address' } },
    errors: [],
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
        <AddressScreen />
      </KycContext.Provider>
    </SafeAreaProvider>
  );
}

describe('AddressScreen', () => {
  it('edits the address section through editField (whole-section merge)', () => {
    const editField = jest.fn();
    renderWith(makeValue({ editField }));

    fireEvent.changeText(screen.getByLabelText('City'), 'London');

    expect(editField).toHaveBeenCalledWith({
      address: { country: '', city: 'London', line1: '' },
    });
  });

  it('goes back via the Back button', () => {
    const prev = jest.fn();
    renderWith(makeValue({ prev }));

    fireEvent.press(screen.getByTestId('address-back'));

    expect(prev).toHaveBeenCalledTimes(1);
  });

  it('reveals inline errors and blocks Next when invalid', () => {
    const next = jest.fn();
    renderWith(
      makeValue({
        next,
        errors: [{ field: 'address.city', message: 'City is required' }],
      })
    );

    expect(screen.queryByText('City is required')).toBeNull();

    fireEvent.press(screen.getByTestId('address-next'));

    expect(next).not.toHaveBeenCalled();
    expect(screen.getByText('City is required')).toBeTruthy();
  });
});
