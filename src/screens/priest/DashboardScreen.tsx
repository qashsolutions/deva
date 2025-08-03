import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PriestHomeStackParamList } from '../../navigation/PriestNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Button, IconButton } from '../../components/common/Button';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { InlineLoader } from '../../components/common/LoadingSpinner';
import { useUser } from '../../contexts/UserContext';
import { useBooking } from '../../contexts/BookingContext';
import { colors, spacing, fontSize } from '../../config/theme';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Booking } from '../../types/booking';

type NavigationProp = NativeStackNavigationProp<PriestHomeStackParamList, 'Dashboard'>;

interface DashboardStats {
  todayBookings: number;
  weekBookings: number;
  monthEarnings: number;
  pendingRequests: number;
  avgRating: number;
  totalReviews: number;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  action: () => void;
  badge?: number;
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state: userState } = useUser();
  const { state: bookingState, loadPriestBookings } = useBooking();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    weekBookings: 0,
    monthEarnings: 0,
    pendingRequests: 0,
    avgRating: 0,
    totalReviews: 0,
  });

  const priestProfile = userState.profile?.userType === 'priest' ? userState.profile.priestProfile : null;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load priest's bookings
      await loadPriestBookings();
      
      // Calculate stats from bookings
      calculateStats();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const allBookings = [...bookingState.upcomingBookings, ...bookingState.pastBookings];
    
    // Today's bookings
    const todayBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.scheduledDate);
      return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    // This week's bookings
    const weekBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.scheduledDate);
      return bookingDate >= weekStart;
    });

    // This month's earnings
    const monthEarnings = allBookings
      .filter(b => {
        const bookingDate = new Date(b.scheduledDate);
        return bookingDate >= monthStart && b.status === 'completed';
      })
      .reduce((sum, b) => sum + (b.priestEarnings || b.totalAmount * 0.7), 0);

    // Pending requests
    const pendingRequests = bookingState.activeBookings.filter(b => b.status === 'pending').length;

    setStats({
      todayBookings: todayBookings.length,
      weekBookings: weekBookings.length,
      monthEarnings,
      pendingRequests,
      avgRating: priestProfile?.averageRating || 0,
      totalReviews: priestProfile?.totalReviews || 0,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'requests',
      title: 'Booking Requests',
      icon: 'notifications',
      color: colors.primary,
      action: () => navigation.navigate('BookingRequests'),
      badge: stats.pendingRequests,
    },
    {
      id: 'calendar',
      title: 'My Calendar',
      icon: 'calendar',
      color: colors.info,
      action: () => navigation.navigate('Calendar'),
    },
    {
      id: 'services',
      title: 'My Services',
      icon: 'list',
      color: colors.success,
      action: () => navigation.navigate('Services'),
    },
    {
      id: 'earnings',
      title: 'Earnings',
      icon: 'wallet',
      color: colors.warning,
      action: () => navigation.navigate('Earnings'),
    },
  ];

  const getUpcomingBookings = () => {
    const now = new Date();
    return bookingState.upcomingBookings
      .filter(b => b.status === 'confirmed' && new Date(b.scheduledDate) > now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 3);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>
          {getGreeting()}, {userState.profile?.firstName}!
        </Text>
        <Text style={styles.date}>{formatDate(new Date(), 'EEEE, MMMM d')}</Text>
      </View>
      <IconButton
        icon={<Ionicons name="notifications-outline" size={24} color={colors.text.primary} />}
        onPress={() => navigation.navigate('Notifications')}
        variant="ghost"
        accessibilityLabel="Notifications"
      />
    </View>
  );

  const renderStats = () => (
    <Card margin="medium" style={styles.statsCard}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.todayBookings}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.weekBookings}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPrice(stats.monthEarnings)}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>
      {stats.avgRating > 0 && (
        <View style={styles.ratingRow}>
          <View style={styles.rating}>
            <Ionicons name="star" size={16} color={colors.warning} />
            <Text style={styles.ratingText}>
              {stats.avgRating.toFixed(1)} ({stats.totalReviews} reviews)
            </Text>
          </View>
        </View>
      )}
    </Card>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {quickActions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.quickAction}
          onPress={action.action}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
            <Ionicons name={action.icon} size={24} color={action.color} />
            {action.badge ? (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>{action.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.quickActionTitle}>{action.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderUpcomingBookings = () => {
    const upcomingBookings = getUpcomingBookings();

    if (upcomingBookings.length === 0) {
      return (
        <SectionCard
          title="Upcoming Bookings"
          headerAction={
            <TouchableOpacity onPress={() => navigation.navigate('BookingManagement')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          }
          margin="medium"
        >
          <EmptyState
            icon="calendar-outline"
            message="No upcoming bookings"
            compact
          />
        </SectionCard>
      );
    }

    return (
      <SectionCard
        title="Upcoming Bookings"
        headerAction={
          <TouchableOpacity onPress={() => navigation.navigate('BookingManagement')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        }
        margin="medium"
      >
        {upcomingBookings.map((booking, index) => (
          <TouchableOpacity
            key={booking.id}
            style={[
              styles.bookingItem,
              index < upcomingBookings.length - 1 && styles.bookingItemBorder,
            ]}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id })}
          >
            <View style={styles.bookingTime}>
              <Text style={styles.bookingTimeText}>
                {formatDate(new Date(booking.scheduledDate), 'MMM d')}
              </Text>
              <Text style={styles.bookingTimeSubtext}>{booking.scheduledTime}</Text>
            </View>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingService} numberOfLines={1}>
                {booking.service.serviceName}
              </Text>
              <Text style={styles.bookingDevotee} numberOfLines={1}>
                {booking.devotee.name}
              </Text>
              <Text style={styles.bookingLocation} numberOfLines={1}>
                <Ionicons name="location" size={12} color={colors.gray[600]} />
                {' '}{booking.location.city}, {booking.location.state}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        ))}
      </SectionCard>
    );
  };

  const renderAvailabilityStatus = () => {
    const isAvailable = priestProfile?.availability?.isAvailable ?? true;
    
    return (
      <Card margin="medium" style={styles.availabilityCard}>
        <View style={styles.availabilityContent}>
          <View>
            <Text style={styles.availabilityLabel}>Your Status</Text>
            <Text style={[
              styles.availabilityStatus,
              { color: isAvailable ? colors.success : colors.gray[600] }
            ]}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
          <Button
            title={isAvailable ? 'Go Offline' : 'Go Online'}
            variant={isAvailable ? 'outline' : 'primary'}
            size="small"
            onPress={() => {
              // Toggle availability
              navigation.navigate('Availability');
            }}
          />
        </View>
      </Card>
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (bookingState.loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <InlineLoader text="Loading dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        {renderStats()}
        {renderQuickActions()}
        {renderAvailabilityStatus()}
        {renderUpcomingBookings()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xlarge,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingTop: spacing.medium,
    paddingBottom: spacing.small,
  },
  greeting: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  date: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  statsCard: {
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
  },
  statValue: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xsmall,
  },
  statLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  ratingRow: {
    alignItems: 'center',
    paddingTop: spacing.medium,
    marginTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    marginLeft: spacing.xsmall,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.medium,
    marginTop: spacing.medium,
  },
  quickAction: {
    width: '50%',
    alignItems: 'center',
    padding: spacing.medium,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.small,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xsmall,
  },
  quickActionBadgeText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '700',
  },
  quickActionTitle: {
    fontSize: fontSize.small,
    color: colors.text.primary,
    textAlign: 'center',
  },
  viewAllText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
  },
  bookingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  bookingTime: {
    width: 60,
    alignItems: 'center',
  },
  bookingTimeText: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.primary,
  },
  bookingTimeSubtext: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  bookingInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  bookingService: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  bookingDevotee: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  bookingLocation: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  availabilityCard: {
    backgroundColor: colors.gray[50],
  },
  availabilityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  availabilityStatus: {
    fontSize: fontSize.medium,
    fontWeight: '600',
  },
});