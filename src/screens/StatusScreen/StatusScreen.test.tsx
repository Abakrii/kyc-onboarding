import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { KycContext } from '../../context/kycProvider';
import type { KycContextValue } from '../../hooks/useKyc';
import { createInitialState, type KycState } from '../../state/kycTypes';
import { StatusScreen } from './StatusScreen';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function makeValue(state: Partial<KycState>, overrides: Partial<KycContextValue> = {}): KycContextValue {
  return {
    state: { ...createInitialState(), uiPhase: 'idle', draft: { currentStep: 'status' }, ...state },
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
        <StatusScreen />
      </KycContext.Provider>
    </SafeAreaProvider>
  );
}

describe('StatusScreen', () => {
  it('shows the in-review block while submitted', () => {
    renderWith(makeValue({ remoteStatus: 'submitted', uiPhase: 'polling' }));
    expect(screen.getByText('In review')).toBeTruthy();
    expect(screen.getByTestId('status-spinner')).toBeTruthy();
  });

  it('shows the approved state with a Start over action', () => {
    const reset = jest.fn();
    renderWith(makeValue({ remoteStatus: 'approved' }, { reset }));

    expect(screen.getByText('Approved')).toBeTruthy();

    fireEvent.press(screen.getByTestId('status-start-over'));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('shows the rejection reason with a Start over action', () => {
    renderWith(
      makeValue({ remoteStatus: 'rejected', rejectionReason: 'Document could not be verified.' })
    );

    expect(screen.getByText('Rejected')).toBeTruthy();
    expect(screen.getByText('Document could not be verified.')).toBeTruthy();
    expect(screen.getByTestId('status-start-over')).toBeTruthy();
  });
});
