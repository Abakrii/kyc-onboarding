import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { KycContext } from '../../context/kycProvider';
import type { KycContextValue } from '../../hooks/useKyc';
import { createInitialState } from '../../state/kycTypes';
import { PersonalInfoScreen } from './PersonalInfoScreen';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function makeValue(overrides: Partial<KycContextValue> = {}): KycContextValue {
  return {
    state: createInitialState(),
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
        <PersonalInfoScreen />
      </KycContext.Provider>
    </SafeAreaProvider>
  );
}

describe('PersonalInfoScreen', () => {
  it('renders the current draft values into the fields', () => {
    const value = makeValue();
    value.state = {
      ...value.state,
      draft: {
        currentStep: 'personal_info',
        personalInfo: {
          legalName: 'Ada Lovelace',
          dateOfBirth: '1815-12-10',
          nationality: 'GB',
        },
      },
    };
    renderWith(value);

    expect(screen.getByLabelText('Legal name').props.value).toBe('Ada Lovelace');
    expect(screen.getByLabelText('Date of birth').props.value).toBe('1815-12-10');
    expect(screen.getByLabelText('Nationality').props.value).toBe('GB');
  });

  it('edits the personalInfo section through editField (whole-section merge)', () => {
    const editField = jest.fn();
    renderWith(makeValue({ editField }));

    fireEvent.changeText(screen.getByLabelText('Legal name'), 'Ada');

    expect(editField).toHaveBeenCalledWith({
      personalInfo: { legalName: 'Ada', dateOfBirth: '', nationality: '' },
    });
  });

  it('advances when the step is valid', () => {
    const next = jest.fn();
    renderWith(makeValue({ next, errors: [] }));

    fireEvent.press(screen.getByTestId('personal-next'));

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('reveals inline errors and blocks Next when invalid', () => {
    const next = jest.fn();
    renderWith(
      makeValue({
        next,
        errors: [
          { field: 'personalInfo.legalName', message: 'Legal name is required' },
        ],
      })
    );

    // Hidden until the user attempts to proceed.
    expect(screen.queryByText('Legal name is required')).toBeNull();

    fireEvent.press(screen.getByTestId('personal-next'));

    expect(next).not.toHaveBeenCalled();
    expect(screen.getByText('Legal name is required')).toBeTruthy();
  });
});
