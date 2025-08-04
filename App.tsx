import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { UserProvider } from './src/contexts/UserContext';
import { BookingProvider } from './src/contexts/BookingContext';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  useEffect(() => {
    // Request notification permissions on app launch
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    };
    
    requestPermissions();
  }, []);

  return (
    <AuthProvider>
      <UserProvider>
        <BookingProvider>
          <StripeProvider
            publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
            merchantIdentifier="merchant.com.devebhyo.app"
          >
            <AppNavigator />
          </StripeProvider>
        </BookingProvider>
      </UserProvider>
    </AuthProvider>
  );
}