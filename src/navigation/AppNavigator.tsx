import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { AuthNavigator } from './AuthNavigator';
import { PriestNavigator } from './PriestNavigator';
import { DevoteeNavigator } from './DevoteeNavigator';
import { colors, commonStyles } from '../config/theme';
import { 
  addNotificationResponseListener, 
  addNotificationReceivedListener,
  registerForPushNotifications,
  savePushToken
} from '../services/notifications';

export type RootStackParamList = {
  Auth: undefined;
  PriestMain: undefined;
  DevoteeMain: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { state: authState, isAuthenticated } = useAuth();
  const { state: userState } = useUser();
  
  // Handle app initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Wait for auth state to be initialized
        if (authState.isInitialized) {
          // Register for push notifications if authenticated
          if (isAuthenticated && authState.userData) {
            const token = await registerForPushNotifications();
            if (token) {
              await savePushToken(authState.userData.id, token);
            }
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };
    
    initializeApp();
  }, [authState.isInitialized, isAuthenticated, authState.userData]);
  
  // Set up notification listeners
  useEffect(() => {
    // Handle notification when app is in foreground
    const notificationListener = addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });
    
    // Handle notification response (when user taps on notification)
    const responseListener = addNotificationResponseListener(response => {
      console.log('Notification response:', response);
      // Navigate based on notification type
      const { type, bookingId } = response.notification.request.content.data || {};
      
      // Handle navigation based on notification type
      // This would use navigation ref to navigate to specific screens
    });
    
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);
  
  // Show loading screen while auth state is initializing
  if (!authState.isInitialized || authState.authState.status === 'loading') {
    return (
      <View style={[commonStyles.centerContent, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }
  
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              {userState.profile?.userType === 'priest' ? (
                <Stack.Screen name="PriestMain" component={PriestNavigator} />
              ) : (
                <Stack.Screen name="DevoteeMain" component={DevoteeNavigator} />
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};