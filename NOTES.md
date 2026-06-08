# NOTES

## AI usage (asked / accepted / rejected / verified)

- **Asked** an AI assistant (Claude Code) to scaffold the UI layer and wiring on
  top of the hand-written pure cores: the component/screen folders, the single
  side-effecting hook, the provider/router, the validator wiring, and the
  PII-redacting logger.
- **Accepted**: the strict layering (UI → hook → cores), folder-per-component
  with sibling `*.styles.ts` built from theme tokens, the two-axis state model,
  the guarded transition table, and routing validation/clock reads through the
  hook (cores stay pure).
- **Rejected / corrected**: flat file paths the prompts suggested
  (`personalInfoScreen.tsx`) in favour of the repo's existing folder + PascalCase
  convention; importing the service layer into screens just for the trigger hint
  (hard-coded with a comment instead, to preserve `UI → hook → core`); relying on
  the reducer's blank-check for Next (the validator is stricter — it enforces the
  DOB rules — so screens gate on the validator).
- **Verified**: `npm run typecheck` (strict, zero errors) and `npm test` (Jest)
  on every change. Screen behaviour is verified by rendering under a stubbed
  `KycContext`; the loading→loaded transition is verified with the real provider.

## Security & reliability

- **No PII in logs.** Names, DOB, nationality, and document numbers never reach a
  log sink. `src/lib/logger.ts` deep-redacts those keys at any depth (arrays and
  cycles handled) and is the only sanctioned `console` path.
- **Plaintext storage tradeoff.** The in-progress draft is cached in
  `AsyncStorage`, which is **unencrypted** — readable on a rooted/jailbroken
  device and captured in unencrypted backups. This is acceptable for a local
  demo, **not** for production. The mitigation is documented in
  `src/storage/draftStorage.ts`: move PII to the OS secure enclave
  (`expo-secure-store`, iOS Keychain / Android Keystore), or keep only
  AES-encrypted ciphertext in AsyncStorage with the data key in SecureStore; gate
  reads behind device auth; clear on logout and on successful submission.
- **Reliability.** Submit is double-tap safe (the fake service shares the
  in-flight promise); requests guard against dispatching into an unmounted tree;
  failures map to generic, PII-free messages and are recoverable via Retry.

## Assumptions & tradeoffs

- The "server" is a local fake with injected latency and deterministic,
  document-number-driven outcomes — no real network/auth.
- The draft cache stores no timestamp, so the conflict strategy treats "holds
  data" as the signal that the local copy wins for editable statuses (a true
  "newer" comparison would need a stored `updatedAt` on the draft).
- Validation is required-field + DOB-format/not-in-future; it is not
  country-specific (e.g. no per-country document-number formats).

## Left out for the timebox

These were designed/specced but not finished in the window:

- **Polling controller extraction** (`startPolling({...}) → { promise, cancel }`)
  — the hook still polls via an inline, bounded `setTimeout` loop with cleanup;
  the standalone injectable-`sleep` controller + its unit tests are not wired.
- **Reconciliation wiring** — `reconcile` / `computeBootstrap` cores (the
  conflict table above) are not yet wired into the hook's bootstrap, which still
  adopts the server application authoritatively (the `reconcile` TODO).
- **StatusScreen / StatusBadge** + tinting the stepper's status node by
  `remoteStatus` — the status step currently renders the generic placeholder.
- **`reset()` / "Start over"** beyond the current clear-draft + re-bootstrap, and
  a public `resetKycApplication()` on the fake service.
- **Coverage threshold** (`coverageThreshold` + `test:coverage`) and the
  end-to-end `integration.test.tsx` driving `<App/>` against the real fake
  service (approved / network-retry / requires_more_info / rejected / resume /
  start-over) with a shortened poll interval.

`src/lib/logger.ts` (PII redaction) is the one piece of that batch that landed,
with tests (`__tests__/logger.test.ts`).
