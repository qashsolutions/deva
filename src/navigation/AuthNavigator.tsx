import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../config/theme';

// Import auth screens (these will be created later)
// import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
// import { PhoneAuthScreen } from '../screens/auth/PhoneAuthScreen';
// import { OTPScreen } from '../screens/auth/OTPScreen';
// import { UserTypeScreen } from '../screens/auth/UserTypeScreen';
// import { PriestTypeScreen } from '../screens/auth/PriestTypeScreen';
// import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';

// Placeholder screens for now
import { View, Text } from 'react-native';
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{route.name} Screen</Text>
  </View>
);

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  OTP: {
    verificationId: string;
    phoneNumber: string;
  };
  UserType: undefined;
  PriestType: undefined;
  ProfileSetup: {
    userType: 'priest' | 'devotee';
    priestType?: 'temple_employee' | 'temple_owner' | 'independent';
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={PlaceholderScreen}
        options={{
          headerShown: false,
        }}
      />
      
      <Stack.Screen
        name="PhoneAuth"
        component={PlaceholderScreen}
        options={{
          title: 'Enter Phone Number',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="OTP"
        component={PlaceholderScreen}
        options={{
          title: 'Verify Code',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="UserType"
        component={PlaceholderScreen}
        options={{
          title: 'Select Your Role',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="PriestType"
        component={PlaceholderScreen}
        options={{
          title: 'Select Priest Type',
          headerShown: true,
        }}
      />
      
      <Stack.Screen
        name="ProfileSetup"
        component={PlaceholderScreen}
        options={{
          title: 'Complete Your Profile',
          headerShown: true,
          headerLeft: () => null, // Prevent going back
          gestureEnabled: false, // Disable swipe back
        }}
      />
    </Stack.Navigator>
  );
};