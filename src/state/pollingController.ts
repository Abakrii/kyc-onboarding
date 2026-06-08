// pollingController — a pure, bounded polling loop. No timers, no clock: the wait
// is injected as `sleep` so the controller stays a deterministic core and tests
// can drive it without real time. It stops on the FIRST of: a settled result,
// the poll cap (`maxPolls`), or `cancel()`. Errors are reported via `onError` and
// counted toward the cap (a transient blip doesn't kill the loop).

export interface StartPollingOptions<T> {
  /** Perform one poll. */
  poll: () => Promise<T>;
  /** True when a result is final (stop polling). */
  isSettled: (result: T) => boolean;
  /** Called with each successful poll result. */
  onResult: (result: T) => void;
  /** Called with each poll error; polling continues (up to the cap). */
  onError: (error: unknown) => void;
  /** Hard cap on the number of poll attempts. */
  maxPolls: number;
  /** Delay between attempts (passed to `sleep`). */
  intervalMs: number;
  /** Injected wait — the only impurity, supplied by the caller. */
  sleep: (ms: number) => Promise<void>;
}

export interface PollingHandle {
  /** Resolves when polling stops (settled, capped, or cancelled). */
  promise: Promise<void>;
  /** Stop polling as soon as possible. Idempotent. */
  cancel: () => void;
}

export function startPolling<T>(options: StartPollingOptions<T>): PollingHandle {
  const { poll, isSettled, onResult, onError, maxPolls, intervalMs, sleep } = options;
  let cancelled = false;

  const run = async (): Promise<void> => {
    for (let attempt = 0; attempt < maxPolls; attempt += 1) {
      if (cancelled) {
        return;
      }
      try {
        const result = await poll();
        if (cancelled) {
          return;
        }
        onResult(result);
        if (isSettled(result)) {
          return;
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        onError(error);
      }
      if (cancelled) {
        return;
      }
      // Wait before the next attempt, but never after the final one.
      if (attempt < maxPolls - 1) {
        await sleep(intervalMs);
      }
    }
  };

  return {
    promise: run(),
    cancel: () => {
      cancelled = true;
    },
  };
}
