// End-to-end: drive the real <App/> (real reducer, hook, fake service) through
// every outcome. The fake service latency is set to 0 and the poll interval is
// shrunk via a mock of pollingConfig, so the full flow runs in milliseconds.

jest.mock('../src/hooks/pollingConfig', () => ({
  POLL_INTERVAL_MS: 5,
  MAX_POLLS: 20,
}));

import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';
import { __reset, __setDelay } from '../src/services/fakeKycServices';
import { MORE_INFO_BANNER } from '../src/state/kycReducer';
import { clearDraft } from '../src/storage/draftStorage';

beforeEach(async () => {
  await __reset();
  await clearDraft();
  __setDelay(0);
});

// ── Flow helpers (drive the wizard through the UI) ──

async function bootstrapToPersonal(): Promise<void> {
  await screen.findByLabelText('Legal name');
}

async function completePersonal(): Promise<void> {
  await screen.findByLabelText('Legal name');
  fireEvent.changeText(screen.getByLabelText('Legal name'), 'Ada Lovelace');
  fireEvent.changeText(screen.getByLabelText('Date of birth'), '1990-05-20');
  fireEvent.changeText(screen.getByLabelText('Nationality'), 'GB');
  fireEvent.press(screen.getByTestId('personal-next'));
}

async function completeAddress(): Promise<void> {
  await screen.findByLabelText('Country');
  fireEvent.changeText(screen.getByLabelText('Country'), 'GB');
  fireEvent.changeText(screen.getByLabelText('City'), 'London');
  fireEvent.changeText(screen.getByLabelText('Address line 1'), '12 Baker St');
  fireEvent.press(screen.getByTestId('address-next'));
}

async function completeDocument(documentNumber: string): Promise<void> {
  await screen.findByLabelText('Document number');
  fireEvent.press(screen.getByLabelText('Passport'));
  fireEvent.changeText(screen.getByLabelText('Document number'), documentNumber);
  fireEvent.press(screen.getByTestId('document-next'));
}

async function submitFromReview(): Promise<void> {
  fireEvent.press(await screen.findByTestId('review-submit'));
}

// Fill every step and submit with the given document number.
async function runToSubmit(documentNumber: string): Promise<void> {
  await completePersonal();
  await completeAddress();
  await completeDocument(documentNumber);
  await submitFromReview();
}

describe('App integration', () => {
  it('happy path → approved', async () => {
    render(<App />);
    await runToSubmit('AB123456');

    expect(await screen.findByText('Approved')).toBeTruthy();
    expect(
      screen.getByText('Your identity has been verified — you’re all set.')
    ).toBeTruthy();
  });

  it('network failure on submit → retry → approved', async () => {
    render(<App />);
    await runToSubmit('NETWORK');

    // First submit fails at the network: an error notice with Retry appears.
    const retry = await screen.findByTestId('error-retry');
    fireEvent.press(retry);

    expect(await screen.findByText('Approved')).toBeTruthy();
  });

  it('requires_more_info → routes back to the document step with a banner', async () => {
    render(<App />);
    await runToSubmit('MOREINFO');

    expect(await screen.findByText(MORE_INFO_BANNER)).toBeTruthy();
    // Routed back to the document step (its field is on screen again).
    expect(screen.getByLabelText('Document number')).toBeTruthy();
  });

  it('rejected → shows the rejection reason', async () => {
    render(<App />);
    await runToSubmit('REJECT');

    expect(await screen.findByText('Rejected')).toBeTruthy();
    expect(screen.getByText('Document could not be verified.')).toBeTruthy();
  });

  it('resumes an in-progress draft after a reload', async () => {
    const first = render(<App />);
    await completePersonal();
    // Now on the address step; the draft (incl. the saved step) is persisted.
    await screen.findByLabelText('Country');
    first.unmount();

    // Fresh mount → bootstrap reconciles the cached draft and resumes.
    render(<App />);
    expect(await screen.findByLabelText('Country')).toBeTruthy();
    expect(screen.queryByLabelText('Legal name')).toBeNull();
  });

  it('start over from a terminal screen resets to a fresh wizard', async () => {
    render(<App />);
    await runToSubmit('AB123456');
    await screen.findByText('Approved');

    fireEvent.press(screen.getByTestId('status-start-over'));

    // Back at the start with empty fields.
    const legalName = await screen.findByLabelText('Legal name');
    expect(legalName.props.value).toBe('');
  });
});
