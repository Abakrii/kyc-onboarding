import { startPolling } from '../src/state/pollingController';

type Result = { status: string };
const immediateSleep = (): Promise<void> => Promise.resolve();

describe('startPolling', () => {
  it.each(['approved', 'rejected', 'requires_more_info'])(
    'stops as soon as the poll settles to %s',
    async (status) => {
      const result: Result = { status };
      const poll = jest.fn(() => Promise.resolve(result));
      const onResult = jest.fn();

      const handle = startPolling<Result>({
        poll,
        isSettled: (r) => r.status !== 'submitted',
        onResult,
        onError: () => {},
        maxPolls: 5,
        intervalMs: 1,
        sleep: immediateSleep,
      });
      await handle.promise;

      expect(poll).toHaveBeenCalledTimes(1);
      expect(onResult).toHaveBeenCalledWith(result);
    }
  );

  it('is bounded by maxPolls when never settled, sleeping between attempts', async () => {
    const poll = jest.fn(() => Promise.resolve<Result>({ status: 'submitted' }));
    const onResult = jest.fn();
    const sleep = jest.fn(() => Promise.resolve());

    const handle = startPolling<Result>({
      poll,
      isSettled: (r) => r.status !== 'submitted',
      onResult,
      onError: () => {},
      maxPolls: 3,
      intervalMs: 7,
      sleep,
    });
    await handle.promise;

    expect(poll).toHaveBeenCalledTimes(3);
    expect(onResult).toHaveBeenCalledTimes(3);
    // Sleeps between the 3 polls, never after the last.
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(7);
  });

  it('stops cleanly when cancelled (no further polls)', async () => {
    const poll = jest.fn(() => Promise.resolve<Result>({ status: 'submitted' }));
    let handle: PollingHandleLike | undefined;
    const onResult = jest.fn(() => {
      handle?.cancel();
    });

    handle = startPolling<Result>({
      poll,
      isSettled: (r) => r.status !== 'submitted',
      onResult,
      onError: () => {},
      maxPolls: 5,
      intervalMs: 1,
      sleep: immediateSleep,
    });
    await handle.promise;

    expect(poll).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('reports errors and keeps polling up to settlement', async () => {
    const poll = jest
      .fn<Promise<Result>, []>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ status: 'approved' });
    const onError = jest.fn();
    const onResult = jest.fn();

    const handle = startPolling<Result>({
      poll,
      isSettled: (r) => r.status !== 'submitted',
      onResult,
      onError,
      maxPolls: 5,
      intervalMs: 1,
      sleep: immediateSleep,
    });
    await handle.promise;

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith({ status: 'approved' });
    expect(poll).toHaveBeenCalledTimes(2);
  });
});

interface PollingHandleLike {
  promise: Promise<void>;
  cancel: () => void;
}
