import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  firebase: {
    app: jest.fn(() => ({
      delete: jest.fn(),
    })),
  },
}));

jest.mock('@react-native-firebase/auth', () => () => ({
  signInWithPhoneNumber: jest.fn(),
  currentUser: null,
}));

jest.mock('@react-native-firebase/firestore', () => () => ({
  collection: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: ({ children }) => children,
  CardField: 'CardField',
  useStripe: () => ({
    initPaymentSheet: jest.fn(),
    presentPaymentSheet: jest.fn(),
  }),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');