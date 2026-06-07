import AsyncStorage from '@react-native-async-storage/async-storage';

// Verifies the test harness itself: the jest-expo preset loads and the
// official AsyncStorage jest mock from jest.setup.js is wired up.
describe('test harness', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('mocks AsyncStorage via the official jest mock', async () => {
    expect(jest.isMockFunction(AsyncStorage.setItem)).toBe(true);

    await AsyncStorage.setItem('probe', 'ok');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('probe', 'ok');
  });
});
