import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { KycProvider } from './src/context/kycProvider';
import { Router } from './src/navigation/Router';

// App root: SafeAreaProvider (so screens can read insets) wraps the single
// KycProvider (the one side-effecting hook instance), and the Router renders the
// current screen. Everything below here is declarative.
export default function App() {
  return (
    <SafeAreaProvider>
      <KycProvider>
        <Router />
        <StatusBar style="auto" />
      </KycProvider>
    </SafeAreaProvider>
  );
}
