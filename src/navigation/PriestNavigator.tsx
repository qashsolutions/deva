import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

// Import priest screens (these will be created later)
// import { DashboardScreen } from '../screens/priest/DashboardScreen';
// import { ServicesScreen } from '../screens/priest/ServicesScreen';
// import { AvailabilityScreen } from '../screens/priest/AvailabilityScreen';
// import { BookingRequestsScreen } from '../screens/priest/BookingRequestsScreen';
// import { EarningsScreen } from '../screens/priest/EarningsScreen';
// import { ProfileScreen } from '../screens/priest/ProfileScreen';
// import { TempleMgmtScreen } from '../screens/priest/TempleMgmtScreen';

// Placeholder screens for now
import { View, Text } from 'react-native';
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Priest {route.name} Screen</Text>
  </View>
);

// Stack navigators for each tab
export type PriestDashboardStackParamList = {
  Dashboard: undefined;
  BookingDetails: { bookingId: string };
  EarningsDetails: undefined;
};

export type PriestServicesStackParamList = {
  ServicesList: undefined;
  ServiceEdit: { serviceId?: string };
  PricingSetup: { serviceId: string };
  PolicySetup: { serviceId: string };
};

export type PriestBookingsStackParamList = {
  BookingRequests: undefined;
  BookingDetails: { bookingId: string };
  QuoteResponse: { bookingId: string };
  Messages: { bookingId: string };
};

export type PriestProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  TempleManagement: undefined;
  ConnectSetup: undefined;
  Settings: undefined;
};

export type PriestTabParamList = {
  DashboardTab: undefined;
  ServicesTab: undefined;
  AvailabilityTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<PriestTabParamList>();
const DashboardStack = createNativeStackNavigator<PriestDashboardStackParamList>();
const ServicesStack = createNativeStackNavigator<PriestServicesStackParamList>();
const BookingsStack = createNativeStackNavigator<PriestBookingsStackParamList>();
const ProfileStack = createNativeStackNavigator<PriestProfileStackParamList>();

// Dashboard Stack
const DashboardStackScreen = () => (
  <DashboardStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.white,
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <DashboardStack.Screen
      name="Dashboard"
      component={PlaceholderScreen}
      options={{ title: 'Dashboard' }}
    />
    <DashboardStack.Screen
      name="BookingDetails"
      component={PlaceholderScreen}
      options={{ title: 'Booking Details' }}
    />
    <DashboardStack.Screen
      name="EarningsDetails"
      component={PlaceholderScreen}
      options={{ title: 'Earnings Details' }}
    />
  </DashboardStack.Navigator>
);

// Services Stack
const ServicesStackScreen = () => (
  <ServicesStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.white,
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <ServicesStack.Screen
      name="ServicesList"
      component={PlaceholderScreen}
      options={{ title: 'My Services' }}
    />
    <ServicesStack.Screen
      name="ServiceEdit"
      component={PlaceholderScreen}
      options={({ route }) => ({
        title: route.params?.serviceId ? 'Edit Service' : 'Add Service',
      })}
    />
    <ServicesStack.Screen
      name="PricingSetup"
      component={PlaceholderScreen}
      options={{ title: 'Pricing Setup' }}
    />
    <ServicesStack.Screen
      name="PolicySetup"
      component={PlaceholderScreen}
      options={{ title: 'Cancellation Policy' }}
    />
  </ServicesStack.Navigator>
);

// Bookings Stack
const BookingsStackScreen = () => (
  <BookingsStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.white,
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <BookingsStack.Screen
      name="BookingRequests"
      component={PlaceholderScreen}
      options={{ title: 'Booking Requests' }}
    />
    <BookingsStack.Screen
      name="BookingDetails"
      component={PlaceholderScreen}
      options={{ title: 'Booking Details' }}
    />
    <BookingsStack.Screen
      name="QuoteResponse"
      component={PlaceholderScreen}
      options={{ title: 'Send Quote' }}
    />
    <BookingsStack.Screen
      name="Messages"
      component={PlaceholderScreen}
      options={{ title: 'Messages' }}
    />
  </BookingsStack.Navigator>
);

// Profile Stack
const ProfileStackScreen = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.white,
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <ProfileStack.Screen
      name="Profile"
      component={PlaceholderScreen}
      options={{ title: 'Profile' }}
    />
    <ProfileStack.Screen
      name="EditProfile"
      component={PlaceholderScreen}
      options={{ title: 'Edit Profile' }}
    />
    <ProfileStack.Screen
      name="TempleManagement"
      component={PlaceholderScreen}
      options={{ title: 'Temple Management' }}
    />
    <ProfileStack.Screen
      name="ConnectSetup"
      component={PlaceholderScreen}
      options={{ title: 'Payment Setup' }}
    />
    <ProfileStack.Screen
      name="Settings"
      component={PlaceholderScreen}
      options={{ title: 'Settings' }}
    />
  </ProfileStack.Navigator>
);

export const PriestNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ServicesTab':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'AvailabilityTab':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'BookingsTab':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesStackScreen}
        options={{ tabBarLabel: 'Services' }}
      />
      <Tab.Screen
        name="AvailabilityTab"
        component={PlaceholderScreen}
        options={{ tabBarLabel: 'Calendar' }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsStackScreen}
        options={{ 
          tabBarLabel: 'Bookings',
          tabBarBadge: undefined, // Will be set based on unread messages
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};