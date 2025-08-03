import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';
import { useNotifications } from '../contexts/UserContext';

// Import devotee screens (these will be created later)
// import { DashboardScreen } from '../screens/devotee/DashboardScreen';
// import { SearchScreen } from '../screens/devotee/SearchScreen';
// import { PriestDetailScreen } from '../screens/devotee/PriestDetailScreen';
// import { BookingFlowScreen } from '../screens/devotee/BookingFlowScreen';
// import { PaymentScreen } from '../screens/devotee/PaymentScreen';
// import { BookingHistoryScreen } from '../screens/devotee/BookingHistoryScreen';
// import { BookingDetailScreen } from '../screens/devotee/BookingDetailScreen';
// import { ProfileScreen } from '../screens/devotee/ProfileScreen';

// Placeholder screens for now
import { View, Text } from 'react-native';
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Devotee {route.name} Screen</Text>
  </View>
);

// Stack navigators for each tab
export type DevoteeHomeStackParamList = {
  Dashboard: undefined;
  QuickSearch: { serviceType?: string };
  Notifications: undefined;
};

export type DevoteeSearchStackParamList = {
  Search: undefined;
  PriestDetail: { priestId: string };
  BookingFlow: { 
    priestId: string;
    serviceId?: string;
  };
  Payment: { 
    bookingId: string;
    amount: number;
  };
  CompareResults: {
    priestIds: string[];
  };
};

export type DevoteeBookingsStackParamList = {
  BookingHistory: undefined;
  BookingDetail: { bookingId: string };
  Messages: { bookingId: string };
  WriteReview: { bookingId: string };
  PaymentStatus: { bookingId: string };
  Reschedule: { bookingId: string };
};

export type DevoteeProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  SavedAddresses: undefined;
  AddAddress: { addressId?: string };
  FavoritePriests: undefined;
  PaymentMethods: undefined;
  LoyaltyCredits: undefined;
  Settings: undefined;
};

export type DevoteeTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  BookingsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<DevoteeTabParamList>();
const HomeStack = createNativeStackNavigator<DevoteeHomeStackParamList>();
const SearchStack = createNativeStackNavigator<DevoteeSearchStackParamList>();
const BookingsStack = createNativeStackNavigator<DevoteeBookingsStackParamList>();
const ProfileStack = createNativeStackNavigator<DevoteeProfileStackParamList>();

// Home Stack
const HomeStackScreen = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.white,
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <HomeStack.Screen
      name="Dashboard"
      component={PlaceholderScreen}
      options={{ 
        title: 'Devebhyo',
        headerLeft: () => null,
      }}
    />
    <HomeStack.Screen
      name="QuickSearch"
      component={PlaceholderScreen}
      options={{ title: 'Quick Search' }}
    />
    <HomeStack.Screen
      name="Notifications"
      component={PlaceholderScreen}
      options={{ title: 'Notifications' }}
    />
  </HomeStack.Navigator>
);

// Search Stack
const SearchStackScreen = () => (
  <SearchStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: colors.white,
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <SearchStack.Screen
      name="Search"
      component={PlaceholderScreen}
      options={{ title: 'Find Priests' }}
    />
    <SearchStack.Screen
      name="PriestDetail"
      component={PlaceholderScreen}
      options={{ title: 'Priest Profile' }}
    />
    <SearchStack.Screen
      name="CompareResults"
      component={PlaceholderScreen}
      options={{ title: 'Compare Priests' }}
    />
    <SearchStack.Screen
      name="BookingFlow"
      component={PlaceholderScreen}
      options={{ title: 'Book Service' }}
    />
    <SearchStack.Screen
      name="Payment"
      component={PlaceholderScreen}
      options={{ 
        title: 'Payment',
        headerBackVisible: false,
        gestureEnabled: false,
      }}
    />
  </SearchStack.Navigator>
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
      name="BookingHistory"
      component={PlaceholderScreen}
      options={{ title: 'My Bookings' }}
    />
    <BookingsStack.Screen
      name="BookingDetail"
      component={PlaceholderScreen}
      options={{ title: 'Booking Details' }}
    />
    <BookingsStack.Screen
      name="Messages"
      component={PlaceholderScreen}
      options={{ title: 'Messages' }}
    />
    <BookingsStack.Screen
      name="WriteReview"
      component={PlaceholderScreen}
      options={{ title: 'Write Review' }}
    />
    <BookingsStack.Screen
      name="PaymentStatus"
      component={PlaceholderScreen}
      options={{ title: 'Payment Status' }}
    />
    <BookingsStack.Screen
      name="Reschedule"
      component={PlaceholderScreen}
      options={{ title: 'Reschedule Booking' }}
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
      name="SavedAddresses"
      component={PlaceholderScreen}
      options={{ title: 'Saved Addresses' }}
    />
    <ProfileStack.Screen
      name="AddAddress"
      component={PlaceholderScreen}
      options={({ route }) => ({
        title: route.params?.addressId ? 'Edit Address' : 'Add Address',
      })}
    />
    <ProfileStack.Screen
      name="FavoritePriests"
      component={PlaceholderScreen}
      options={{ title: 'Favorite Priests' }}
    />
    <ProfileStack.Screen
      name="PaymentMethods"
      component={PlaceholderScreen}
      options={{ title: 'Payment Methods' }}
    />
    <ProfileStack.Screen
      name="LoyaltyCredits"
      component={PlaceholderScreen}
      options={{ title: 'Loyalty Credits' }}
    />
    <ProfileStack.Screen
      name="Settings"
      component={PlaceholderScreen}
      options={{ title: 'Settings' }}
    />
  </ProfileStack.Navigator>
);

export const DevoteeNavigator: React.FC = () => {
  const { unreadCount } = useNotifications();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'SearchTab':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'BookingsTab':
              iconName = focused ? 'calendar' : 'calendar-outline';
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
        name="HomeTab"
        component={HomeStackScreen}
        options={{ 
          tabBarLabel: 'Home',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={BookingsStackScreen}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};