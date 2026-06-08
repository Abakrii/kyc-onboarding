import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { KycContext } from '../../context/kycProvider';
import type { KycContextValue } from '../../hooks/useKyc';
import { createInitialState } from '../../state/kycTypes';
import { ReviewScreen } from './ReviewScreen';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const COMPLETE_DRAFT = {
  currentStep: 'review',
  personalInfo: {
    legalName: 'Ada Lovelace',
    dateOfBirth: '1815-12-10',
    nationality: 'GB',
  },
  address: { country: 'GB', city: 'London', line1: '12 Baker St' },
  document: { type: 'passport', documentNumber: 'AB123456' },
} as const;

function makeValue(overrides: Partial<KycContextValue> = {}): KycContextValue {
  return {
    state: { ...createInitialState(), draft: { ...COMPLETE_DRAFT } },
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
        <ReviewScreen />
      </KycContext.Provider>
    </SafeAreaProvider>
  );
}

describe('ReviewScreen', () => {
  it('renders a summary value for each section', () => {
    renderWith(makeValue());

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('London')).toBeTruthy();
    expect(screen.getByText('Passport')).toBeTruthy(); // document type label
    expect(screen.getByText('AB123456')).toBeTruthy();
  });

  it('edits a section via its Edit link', () => {
    const goToStep = jest.fn();
    renderWith(makeValue({ goToStep }));

    fireEvent.press(screen.getByTestId('review-edit-address'));

    expect(goToStep).toHaveBeenCalledWith('address');
  });

  it('submits via the Submit button', () => {
    const submit = jest.fn();
    renderWith(makeValue({ submit }));

    fireEvent.press(screen.getByTestId('review-submit'));

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('disables Submit while a submission is in flight', () => {
    const submit = jest.fn();
    renderWith(
      makeValue({ submit, state: { ...createInitialState(), uiPhase: 'submitting' } })
    );

    expect(
      screen.getByTestId('review-submit').props.accessibilityState.disabled
    ).toBe(true);

    fireEvent.press(screen.getByTestId('review-submit'));
    expect(submit).not.toHaveBeenCalled();
  });
});
