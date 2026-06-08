import { render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { KycProvider } from '../../context/kycProvider';
import { __reset } from '../../services/fakeKycServices';
import { clearDraft } from '../../storage/draftStorage';
import { Router } from './Router';

const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

beforeEach(async () => {
  await __reset();
  await clearDraft();
});

function renderApp(): void {
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <KycProvider>
        <Router />
      </KycProvider>
    </SafeAreaProvider>
  );
}

describe('Router', () => {
  it('shows a spinner while loading, then renders the current step', async () => {
    renderApp();

    expect(screen.getByTestId('loading-spinner')).toBeTruthy();

    // Bootstrap resolves to not_started → personal_info.
    await waitFor(() => expect(screen.getByText('Personal information')).toBeTruthy());
    expect(screen.queryByTestId('loading-spinner')).toBeNull();
  });
});
