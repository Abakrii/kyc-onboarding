// KycProvider — shares a SINGLE useKyc instance across the tree. useKyc is the
// one side-effecting hook, so it must be instantiated exactly once (calling it in
// multiple components would spin up duplicate bootstrap/poll/persist effects).
// Mount this once near the root; everything below reads the flow via
// `useKycContext`.
//
// `KycContext` is exported so tests can render a consumer under a custom
// provider value (a stubbed KycContextValue) without standing up the real hook.

import { createContext, useContext, type ReactNode } from 'react';

import { useKyc, type KycContextValue } from '../hooks/useKyc';

export const KycContext = createContext<KycContextValue | null>(null);

export function KycProvider({ children }: { children: ReactNode }) {
  const value = useKyc();
  return <KycContext.Provider value={value}>{children}</KycContext.Provider>;
}

// Consumer hook. Throws if used outside a KycProvider so a missing provider is a
// loud, immediate error rather than a confusing null dereference.
export function useKycContext(): KycContextValue {
  const value = useContext(KycContext);
  if (value === null) {
    throw new Error('useKycContext must be used within a KycProvider');
  }
  return value;
}
