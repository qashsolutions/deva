import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  DevoteeTabParamList, 
  DevoteeHomeStackParamList,
  DevoteeSearchStackParamList 
} from '../../navigation/DevoteeNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { CompactRating } from '../../components/common/Rating';
import { InlineLoader } from '../../components/common/LoadingSpinner';
import { NoBookingsEmptyState } from '../../components/common/EmptyState';
import { useUser } from '../../contexts/UserContext';
import { useBooking } from '../../contexts/BookingContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { SERVICE_TYPES } from '../../config/constants';
import { formatPrice } from '../../utils/formatters';
import { PriestProfile } from '../../types/user';
import { Booking } from '../../types/booking';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DevoteeTabParamList, 'HomeTab'>,
  CompositeNavigationProp<
    NativeStackNavigationProp<DevoteeHomeStackParamList>,
    NativeStackNavigationProp<DevoteeSearchStackParamList>
  >
>;

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  serviceType?: string;
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state: userState } = useUser();
  const { state: bookingState, loadUpcomingBookings } = useBooking();
  
  const [refreshing, setRefreshing] = useState(false);
  const [recentPriests, setRecentPriests] = useState<PriestProfile[]>([]);
  const [loadingPriests, setLoadingPriests] = useState(true);

  const quickActions: QuickAction[] = [
    { id: 'griha_pravesh', title: 'House Warming', icon: 'home', serviceType: 'griha_pravesh' },
    { id: 'satyanarayan_puja', title: 'Satyanarayan', icon: 'flower', serviceType: 'satyanarayan_puja' },
    { id: 'wedding', title: 'Wedding', icon: 'heart', serviceType: 'wedding' },
    { id: 'more', title: 'More Services', icon: 'grid' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load upcoming bookings
      await loadUpcomingBookings();
      
      // Load recent priests (mock data for now)
      setTimeout(() => {
        setRecentPriests(getMockRecentPriests());
        setLoadingPriests(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoadingPriests(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === 'more') {
      navigation.navigate('SearchTab', {
        screen: 'Search',
      });
    } else {
      navigation.navigate('HomeTab', {
        screen: 'QuickSearch',
        params: { serviceType: action.serviceType },
      });
    }
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('BookingsTab', {
      screen: 'BookingDetail',
      params: { bookingId: booking.id },
    });
  };

  const handlePriestPress = (priestId: string) => {
    navigation.navigate('SearchTab', {
      screen: 'PriestDetail',
      params: { priestId },
    });
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[colors.primary, colors.primary + '80']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>
            Namaste, {userState.profile?.firstName}! 🙏
          </Text>
          <Text style={styles.subGreeting}>
            Find the perfect priest for your ceremonies
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('HomeTab', { screen: 'Notifications' })}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.white} />
          {userState.notifications.unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {userState.notifications.unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('SearchTab', { screen: 'Search' })}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <Text style={styles.searchPlaceholder}>Search for priests or services...</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickAction}
            onPress={() => handleQuickAction(action)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name={action.icon} size={28} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderUpcomingBooking = ({ item }: { item: Booking }) => (
    <Card
      onPress={() => handleBookingPress(item)}
      margin="small"
      style={styles.bookingCard}
    >
      <View style={styles.bookingHeader}>
        <Avatar
          source={{ uri: item.priest.photoURL }}
          name={item.priest.name}
          size="medium"
        />
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingPriestName}>{item.priest.name}</Text>
          <Text style={styles.bookingService}>
            {SERVICE_TYPES.find(s => s.id === item.service.serviceType)?.name || item.service.serviceName}
          </Text>
        </View>
        <StatusBadge status={item.status} size="small" />
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.bookingDetailItem}>
          <Ionicons name="calendar" size={16} color={colors.gray[600]} />
          <Text style={styles.bookingDetailText}>
            {new Date(item.scheduledDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.bookingDetailItem}>
          <Ionicons name="time" size={16} color={colors.gray[600]} />
          <Text style={styles.bookingDetailText}>{item.scheduledTime}</Text>
        </View>
        <View style={styles.bookingDetailItem}>
          <Ionicons name="location" size={16} color={colors.gray[600]} />
          <Text style={styles.bookingDetailText} numberOfLines={1}>
            {item.location.city}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderRecentPriest = ({ item }: { item: PriestProfile }) => (
    <Card
      onPress={() => handlePriestPress(item.id)}
      padding="medium"
      margin="small"
      style={styles.priestCard}
    >
      <Avatar
        source={{ uri: item.photoURL }}
        name={`${item.firstName} ${item.lastName}`}
        size="large"
        verified={item.priestProfile?.rating.count > 10}
      />
      <Text style={styles.priestName} numberOfLines={1}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={styles.priestLocation} numberOfLines={1}>
        {item.location.city}, {item.location.state}
      </Text>
      <CompactRating
        value={item.priestProfile?.rating.average || 0}
        count={item.priestProfile?.rating.count}
        size="small"
        style={styles.priestRating}
      />
      <Text style={styles.priestPrice}>
        From {formatPrice(150)}
      </Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderHeader()}
        {renderQuickActions()}

        {/* Upcoming Bookings */}
        <SectionCard
          title="Upcoming Bookings"
          subtitle={bookingState.upcomingBookings.length > 0 ? `${bookingState.upcomingBookings.length} scheduled` : undefined}
          headerAction={
            bookingState.upcomingBookings.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('BookingsTab', { screen: 'BookingHistory' })}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )
          }
          margin="medium"
          padding="none"
        >
          {bookingState.loading ? (
            <InlineLoader text="Loading bookings..." />
          ) : bookingState.upcomingBookings.length > 0 ? (
            <FlatList
              data={bookingState.upcomingBookings.slice(0, 3)}
              renderItem={renderUpcomingBooking}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <NoBookingsEmptyState
              action={{
                label: 'Find Priests',
                onPress: () => navigation.navigate('SearchTab', { screen: 'Search' }),
              }}
              style={{ paddingVertical: spacing.xlarge }}
            />
          )}
        </SectionCard>

        {/* Recent Priests */}
        <View style={styles.recentPriestsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Priests Near You</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SearchTab', { screen: 'Search' })}
            >
              <Text style={styles.viewAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {loadingPriests ? (
            <InlineLoader text="Finding priests..." />
          ) : (
            <FlatList
              horizontal
              data={recentPriests}
              renderItem={renderRecentPriest}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.priestsList}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Mock data generator
const getMockRecentPriests = (): PriestProfile[] => {
  return [
    {
      id: '1',
      userType: 'priest',
      firstName: 'Pandit',
      lastName: 'Sharma',
      email: 'sharma@example.com',
      phoneNumber: '+15551234567',
      photoURL: 'https://via.placeholder.com/150',
      location: {
        zipCode: '94107',
        city: 'San Francisco',
        state: 'CA',
        coordinates: null,
      },
      priestProfile: {
        priestType: 'independent',
        templeAffiliation: null,
        yearsOfExperience: 15,
        languages: ['english', 'hindi', 'sanskrit'],
        certifications: ['Vedic Studies', 'Astrology'],
        bio: 'Experienced priest specializing in all Hindu ceremonies',
        services: [],
        availability: { schedule: {}, blackoutDates: [] },
        pricing: { travelRadius: 25, additionalMileRate: 2 },
        rating: { average: 4.8, count: 127 },
        totalBookings: 250,
        responseTime: 2,
        acceptanceRate: 95,
        stripeAccountId: null,
        stripeAccountStatus: 'not_connected',
        bankAccountLast4: null,
        instantPayoutEnabled: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      fcmToken: null,
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    },
    // Add more mock priests as needed
  ];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: spacing.large,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.xlarge,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.large,
  },
  greeting: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xsmall,
  },
  subGreeting: {
    fontSize: fontSize.medium,
    color: colors.white + 'CC',
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.small,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: fontSize.xsmall,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    marginHorizontal: spacing.small,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: spacing.small,
    fontSize: fontSize.medium,
    color: colors.gray[400],
  },
  quickActionsContainer: {
    padding: spacing.large,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.small,
  },
  quickAction: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: spacing.small,
    marginBottom: spacing.medium,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.small,
  },
  quickActionText: {
    fontSize: fontSize.xsmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  bookingCard: {
    marginHorizontal: spacing.medium,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  bookingPriestName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  bookingService: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingDetailText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.xsmall,
  },
  recentPriestsSection: {
    paddingTop: spacing.medium,
    paddingBottom: spacing.xlarge,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    marginBottom: spacing.medium,
  },
  viewAllText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  priestsList: {
    paddingHorizontal: spacing.medium,
  },
  priestCard: {
    width: 140,
    alignItems: 'center',
  },
  priestName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.small,
    textAlign: 'center',
  },
  priestLocation: {
    fontSize: fontSize.xsmall,
    color: colors.text.secondary,
    marginTop: spacing.xsmall,
    textAlign: 'center',
  },
  priestRating: {
    marginTop: spacing.small,
  },
  priestPrice: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.small,
  },
});