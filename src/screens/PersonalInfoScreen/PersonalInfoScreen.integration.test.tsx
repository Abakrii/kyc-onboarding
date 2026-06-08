// Integration test: the REAL useKyc hook + reducer (no mocked editField), so the
// edit round-trip (type -> editField -> EDIT_DRAFT -> draft -> controlled value)
// is actually exercised. The unit test mocks editField and uses changeText, which
// fires onChangeText even on a non-editable field — it cannot catch a broken
// round-trip or a field that is not actually editable.

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { KycProvider } from '../../context/kycProvider';
import { __reset } from '../../services/fakeKycServices';
import { PersonalInfoScreen } from './PersonalInfoScreen';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

beforeEach(async () => {
  await __reset();
});

function renderScreen(): void {
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <KycProvider>
        <PersonalInfoScreen />
      </KycProvider>
    </SafeAreaProvider>
  );
}

it('renders the field as editable', async () => {
  renderScreen();
  const field = await screen.findByLabelText('Legal name');
  expect(field.props.editable).not.toBe(false);
});

it('keeps typed characters in the field (real edit round-trip)', async () => {
  renderScreen();
  await screen.findByLabelText('Legal name');

  fireEvent.changeText(screen.getByLabelText('Legal name'), 'Ada');

  await waitFor(() => {
    expect(screen.getByLabelText('Legal name').props.value).toBe('Ada');
  });
});
