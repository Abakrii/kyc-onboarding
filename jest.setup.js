// Mock @react-native-async-storage/async-storage with its official jest mock.
// https://react-native-async-storage.github.io/async-storage/docs/advanced/jest/
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-safe-area-context with its official jest mock so screens
// render synchronously in tests (no real onLayout) — and so <App/> can be driven
// end-to-end without supplying initialMetrics.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// Silence the PII-redacting logger during tests (it routes the hook's logging).
require('./src/lib/logger').setSilent(true);
