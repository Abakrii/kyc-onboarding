# AGENTS.md

Conventions for the KYC onboarding app. These are binding — follow them exactly.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before
writing any code. Do not rely on memory of older Expo APIs.

## Tooling

- **TypeScript is strict.** `strict`, `noUnusedLocals`, and `noUnusedParameters`
  are on. No unused locals, no unused parameters — prefix intentionally-unused
  params with `_` only when an external signature forces them.
- `npm run typecheck` — `tsc --noEmit`, must pass with zero errors.
- `npm test` — Jest via the `jest-expo` preset. `jest.setup.js` mocks
  `@react-native-async-storage/async-storage` with its official jest mock.

## Architecture

### Strict layering with pure cores

Business logic lives in **pure functions** — no I/O, no `Date.now()`, no
randomness, no storage, no network, no React. Given the same input they return
the same output. This is the "core". Cores are trivially unit-tested and hold
the rules (validation, transition logic, derivations).

Everything impure is pushed to the edges. The dependency arrow points one way:
UI → hook → core. Cores never import from the hook or UI; the hook never
imports UI.

### One side-effecting hook

There is exactly **one** hook that performs side effects (storage, network,
timers). All effects funnel through it. Components stay declarative and call
into that single hook; they do not run effects of their own. Adding a second
side-effecting hook is a smell — extend the one we have or move the logic into
a pure core.

### Component folder structure

Every FE component lives in **its own folder** under `src/components/`, named
after the component. The folder co-locates exactly three things plus a barrel:

- `Name.tsx` — the component (declarative; no inline styles).
- `Name.styles.ts` — its `StyleSheet`, built from the shared theme tokens. The
  `StyleSheet.create` call lives here, never inside the component.
- `Name.test.tsx` — its test, sitting next to the code it covers.
- `index.ts` — re-exports the component (and its prop types).

```
src/components/
  theme.ts            ← shared design tokens (not a component)
  index.ts            ← top-level barrel
  Button/
    Button.tsx
    Button.styles.ts
    Button.test.tsx
    index.ts
```

Shared, non-component modules (e.g. `theme.ts`) stay as flat files at the
`src/components/` root. Consumers import from the top-level barrel
(`../components`), not from individual component folders.

### Two state axes: `remoteStatus` vs `uiPhase`

State is modeled along two **orthogonal** axes — never collapse them into one
enum:

- `remoteStatus` — the state of the backend interaction
  (e.g. `idle | loading | success | error`).
- `uiPhase` — where the user is in the flow / what the screen is showing
  (e.g. which onboarding step).

A network failure changes `remoteStatus`, not `uiPhase`. Navigating steps
changes `uiPhase`, not `remoteStatus`. Keeping them separate prevents the
impossible-state explosion of a single fused enum.

### Guard every status change via a transition table

No axis is mutated by ad-hoc assignment. Every change to `remoteStatus` and
`uiPhase` goes through an explicit **transition table** — a map of
`current -> allowed next states`. A transition not present in the table is
rejected (and is a bug). This keeps illegal transitions unrepresentable and the
state machine auditable. The transition table is a pure core and is unit-tested
directly.

## Security

- **Never log PII.** This app handles KYC data — names, dates of birth,
  government IDs, document images, addresses. Never `console.log`, send to
  analytics/crash reporters, or persist these in plaintext logs. Log opaque
  identifiers and status codes only; redact everything else. When in doubt,
  do not log it.
