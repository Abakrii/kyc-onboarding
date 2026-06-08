# KYC Onboarding

A React Native (Expo SDK 56) KYC onboarding wizard: personal info → address →
document → review → status, backed by a local fake "service" with deterministic
outcomes.

## Setup

```bash
npm install
npm start         # Expo dev server (then i / a / w for iOS / Android / web)
```

## Tests (one command)

```bash
npm test          # Jest via the jest-expo preset
npm run typecheck # tsc --noEmit, strict
```

## Architecture

Strict one-way layering with pure cores at the centre:

```
UI (components / screens)  →  one side-effecting hook (useKyc)  →  pure cores
```

- **Pure cores** (`src/state`, `src/types`, `src/validation`, `src/lib`): no I/O,
  no `Date.now()`, no randomness, no React. Same input → same output. They hold
  the rules: the reducer, the transition table, selectors, the validator, and the
  redacting logger. The only clock-dependent rule (date-of-birth not-in-future)
  takes `now: Date` as an explicit parameter, supplied by the hook.
- **One side-effecting hook** (`src/hooks/useKyc.ts`): the *only* place that does
  storage, network, and timers. Components stay declarative and call into it via
  `KycProvider` / `useKycContext`.
- **Components / screens** (`src/components`, `src/screens`, `src/navigation`):
  each in its own folder with a sibling `*.styles.ts` (built from `theme` tokens)
  and a `*.test.tsx`; re-exported from a barrel.

### Two state axes (never collapsed into one enum)

| Axis           | Meaning                              | Example values |
| -------------- | ------------------------------------ | -------------- |
| `remoteStatus` | the server's view of the application | `not_started · draft · submitted · requires_more_info · approved · rejected` |
| `uiPhase`      | what the client is doing right now   | `loading · idle · saving · submitting · polling · error` |

A network failure changes `uiPhase` (→ `error`), not `remoteStatus`. Navigating
steps changes the wizard position, not `remoteStatus`. Keeping them orthogonal
avoids the impossible-state explosion of a single fused enum.

### Transition table (`remoteStatus`)

Every status change goes through a guarded transition table; anything not in the
table is rejected (and is a bug).

```
not_started ──▶ draft ──▶ submitted ──▶ approved            (terminal)
                                  ├──▶ rejected            (terminal)
                                  └──▶ requires_more_info ──▶ submitted
```

`approved` and `rejected` are terminal (no outgoing transitions). Same → same is
an idempotent no-op.

### Conflict strategy (bootstrap: local draft vs. server)

On launch the local draft cache is reconciled against the server copy:

| Server status                                         | Strategy                                                               |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `submitted` / `approved` / `rejected` (service-owned) | server wins; banner if the device held *unsynced* edits                |
| `requires_more_info`                                  | keep the device's field edits, route to the first still-required field  |
| `draft` / `not_started`                               | local wins if it holds data; otherwise the server copy stands          |

### Deterministic triggers (fake service)

The fake backend keys its outcome off the **document number**, so every path is
reproducible:

| Document number | Outcome                                                   |
| --------------- | -------------------------------------------------------- |
| `REJECT`        | → `rejected` after review                                  |
| `MOREINFO`      | → `requires_more_info` (routes back to the document step)  |
| `NETWORK`       | first submit fails at the network; a retry succeeds       |
| anything else   | → `approved` after two polls                               |

## Project layout

```
src/
  components/   Button, TextField, OptionGroup, ErrorNotice, WizardHeader, theme
  screens/      PersonalInfo, Address, Document, Review, (Status), StepLayout
  navigation/   Router (spinner while loading, switches on currentStep)
  hooks/        useKyc — the single side-effecting hook
  context/      KycProvider / useKycContext
  state/        reducer, transition table, selectors, types
  validation/   field / step / application validator
  services/     fake KYC backend (deterministic)
  storage/      versioned local draft cache
  lib/          PII-redacting logger
```

See [NOTES.md](NOTES.md) for AI-usage notes, security/reliability tradeoffs, and
what was deferred for the timebox.
