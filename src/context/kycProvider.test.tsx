import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { __reset } from '../services/fakeKycServices';
import { INCOMPLETE_STEP_BANNER } from '../state/kycReducer';
import { clearDraft } from '../storage/draftStorage';
import { KycProvider, useKycContext } from './kycProvider';

beforeEach(async () => {
  await __reset();
  await clearDraft();
});

// A minimal consumer that surfaces the bits of state under test and exposes the
// actions as pressables.
function Probe(): React.JSX.Element {
  const { state, editField, next, dismissBanner } = useKycContext();
  return (
    <>
      <Text testID="phase">{state.uiPhase}</Text>
      <Text testID="status">{state.remoteStatus}</Text>
      <Text testID="step">{state.draft.currentStep}</Text>
      <Text testID="name">{state.draft.personalInfo?.legalName ?? ''}</Text>
      <Text testID="banner">{state.banner ?? ''}</Text>
      <Pressable
        testID="edit"
        onPress={() =>
          editField({
            personalInfo: {
              legalName: 'Ada Lovelace',
              dateOfBirth: '1815-12-10',
              nationality: 'GB',
            },
          })
        }
      >
        <Text>edit</Text>
      </Pressable>
      <Pressable testID="next" onPress={next}>
        <Text>next</Text>
      </Pressable>
      <Pressable testID="dismiss" onPress={dismissBanner}>
        <Text>dismiss</Text>
      </Pressable>
    </>
  );
}

function renderProvider(): void {
  render(
    <KycProvider>
      <Probe />
    </KycProvider>
  );
}

const text = (testID: string): unknown => screen.getByTestId(testID).props.children;

describe('KycProvider', () => {
  it('bootstraps from the service and settles to idle', async () => {
    renderProvider();

    await waitFor(() => expect(text('phase')).toBe('idle'));
    expect(text('status')).toBe('not_started');
    expect(text('step')).toBe('personal_info');
  });

  it('requires a provider', () => {
    // Silence the expected React error boundary log for this throw.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/within a KycProvider/);
    spy.mockRestore();
  });

  it('edits a draft section through editField', async () => {
    renderProvider();
    await waitFor(() => expect(text('phase')).toBe('idle'));

    fireEvent.press(screen.getByTestId('edit'));

    await waitFor(() => expect(text('name')).toBe('Ada Lovelace'));
  });

  it('advances to the next step once the required fields are filled', async () => {
    renderProvider();
    await waitFor(() => expect(text('phase')).toBe('idle'));

    fireEvent.press(screen.getByTestId('edit'));
    await waitFor(() => expect(text('name')).toBe('Ada Lovelace'));

    fireEvent.press(screen.getByTestId('next'));

    await waitFor(() => expect(text('step')).toBe('address'));
  });

  it('shows then dismisses the incomplete-step banner', async () => {
    renderProvider();
    await waitFor(() => expect(text('phase')).toBe('idle'));

    // personal_info is empty, so advancing is blocked with a banner.
    fireEvent.press(screen.getByTestId('next'));
    await waitFor(() => expect(text('banner')).toBe(INCOMPLETE_STEP_BANNER));
    expect(text('step')).toBe('personal_info');

    fireEvent.press(screen.getByTestId('dismiss'));
    await waitFor(() => expect(text('banner')).toBe(''));
  });
});
