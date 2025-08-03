import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StripeConfig } from './src/config/stripe';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { UserProvider } from './src/contexts/UserContext';
import { BookingProvider } from './src/contexts/BookingContext';

export default function App() {
  return (
    <StripeProvider
      publishableKey={StripeConfig.publishableKey}
      merchantIdentifier={StripeConfig.merchantIdentifier}
      urlScheme="devebhyo"
    >
      <AuthProvider>
        <UserProvider>
          <BookingProvider>
            <AppNavigator />
          </BookingProvider>
        </UserProvider>
      </AuthProvider>
    </StripeProvider>
  );
}