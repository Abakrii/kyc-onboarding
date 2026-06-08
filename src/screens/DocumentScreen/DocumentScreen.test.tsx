import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { KycContext } from '../../context/kycProvider';
import type { KycContextValue } from '../../hooks/useKyc';
import { createInitialState } from '../../state/kycTypes';
import { DocumentScreen } from './DocumentScreen';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function makeValue(overrides: Partial<KycContextValue> = {}): KycContextValue {
  return {
    state: { ...createInitialState(), draft: { currentStep: 'document' } },
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
        <DocumentScreen />
      </KycContext.Provider>
    </SafeAreaProvider>
  );
}

describe('DocumentScreen', () => {
  it('renders the type pills and the trigger-document hint', () => {
    renderWith(makeValue());

    expect(screen.getByText('Passport')).toBeTruthy();
    expect(screen.getByText('National ID')).toBeTruthy();
    expect(screen.getByText('Driver’s license')).toBeTruthy();

    // The hint lists the magic document numbers.
    expect(screen.getByText(/MOREINFO/)).toBeTruthy();
    expect(screen.getByText(/REJECT/)).toBeTruthy();
    expect(screen.getByText(/NETWORK/)).toBeTruthy();
  });

  it('selects a document type via the pills (whole-section merge)', () => {
    const editField = jest.fn();
    renderWith(makeValue({ editField }));

    fireEvent.press(screen.getByLabelText('National ID'));

    expect(editField).toHaveBeenCalledWith({
      document: { type: 'national_id', documentNumber: '' },
    });
  });

  it('edits the document number, defaulting the type', () => {
    const editField = jest.fn();
    renderWith(makeValue({ editField }));

    fireEvent.changeText(screen.getByLabelText('Document number'), 'AB123456');

    expect(editField).toHaveBeenCalledWith({
      document: { type: 'passport', documentNumber: 'AB123456' },
    });
  });

  it('reveals inline errors and blocks Next when invalid', () => {
    const next = jest.fn();
    renderWith(
      makeValue({
        next,
        errors: [
          { field: 'document.documentNumber', message: 'Document number is required' },
        ],
      })
    );

    fireEvent.press(screen.getByTestId('document-next'));

    expect(next).not.toHaveBeenCalled();
    expect(screen.getByText('Document number is required')).toBeTruthy();
  });
});
