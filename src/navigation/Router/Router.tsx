// Router — the top of the declarative tree. It reads the flow from the one hook
// (via context) and renders exactly one screen: a centred spinner while the
// initial state is loading, otherwise the screen for the current wizard step.
// Switching on `currentStep` (the uiPhase axis) keeps navigation a pure function
// of state.

import { ActivityIndicator, View } from 'react-native';

import { colors } from '../../components/theme';
import { useKycContext } from '../../context/kycProvider';
import {
  AddressScreen,
  DocumentScreen,
  PersonalInfoScreen,
  ReviewScreen,
  StatusScreen,
} from '../../screens';
import { routerStyles as s } from './Router.styles';

export function Router() {
  const { state } = useKycContext();

  if (state.uiPhase === 'loading') {
    return (
      <View style={s.loading}>
        <ActivityIndicator testID="loading-spinner" size="large" color={colors.primary} />
      </View>
    );
  }

  switch (state.draft.currentStep) {
    case 'personal_info':
      return <PersonalInfoScreen />;
    case 'address':
      return <AddressScreen />;
    case 'document':
      return <DocumentScreen />;
    case 'review':
      return <ReviewScreen />;
    case 'status':
      return <StatusScreen />;
    default: {
      // Exhaustiveness guard: a new KycStep won't compile until it's routed.
      const exhaustive: never = state.draft.currentStep;
      return exhaustive;
    }
  }
}
