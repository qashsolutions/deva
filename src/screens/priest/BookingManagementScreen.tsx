import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PriestBookingsStackParamList } from '../../navigation/PriestNavigator';
import { Card } from '../../components/common/Card';
import { Button, OutlineButton } from '../../components/common/Button';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { UserAvatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { InlineLoader } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/Modal';
import { useBooking } from '../../contexts/BookingContext';
import { colors, spacing, fontSize } from '../../config/theme';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Booking, BookingStatus } from '../../types/booking';
import { SERVICE_TYPES } from '../../config/constants';

type NavigationProp = NativeStackNavigationProp<PriestBookingsStackParamList, 'BookingList'>;

interface BookingFilters {
  status: BookingStatus | 'all';
  dateRange: 'today' | 'week' | 'month' | 'all';
}

export const BookingManagementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state: bookingState, loadPriestBookings, updateBookingStatus } = useBooking();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<BookingFilters>({
    status: 'all',
    dateRange: 'week',
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | 'complete' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await loadPriestBookings();
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const getFilteredBookings = () => {
    const allBookings = [
      ...bookingState.activeBookings,
      ...bookingState.upcomingBookings,
      ...bookingState.pastBookings,
    ];

    let filtered = allBookings;

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(b => b.status === filters.status);
    }

    // Filter by date range
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    
    switch (filters.dateRange) {
      case 'today':
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.scheduledDate);
          return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });
        break;
      case 'week':
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.scheduledDate);
          return bookingDate >= today && bookingDate < weekFromNow;
        });
        break;
      case 'month':
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        filtered = filtered.filter(b => {
          const bookingDate = new Date(b.scheduledDate);
          return bookingDate >= today && bookingDate < monthFromNow;
        });
        break;
    }

    // Sort by date
    return filtered.sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
  };

  const handleBookingAction = async () => {
    if (!selectedBooking || !actionType) return;

    setProcessing(true);

    try {
      let newStatus: BookingStatus;
      let message: string;

      switch (actionType) {
        case 'accept':
          newStatus = 'confirmed';
          message = 'Booking accepted successfully';
          break;
        case 'decline':
          newStatus = 'cancelled';
          message = 'Booking declined';
          break;
        case 'complete':
          newStatus = 'completed';
          message = 'Booking marked as completed';
          break;
        default:
          return;
      }

      await updateBookingStatus(selectedBooking.id, newStatus);
      Alert.alert('Success', message);
      
      // Refresh data
      await loadInitialData();
    } catch (error) {
      console.error('Failed to update booking:', error);
      Alert.alert('Error', 'Failed to update booking status');
    } finally {
      setProcessing(false);
      setShowActionModal(false);
      setSelectedBooking(null);
      setActionType(null);
    }
  };

  const handleContactDevotee = (booking: Booking) => {
    navigation.navigate('Messages', { bookingId: booking.id });
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status:</Text>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filters.status === status && styles.filterChipActive,
              ]}
              onPress={() => setFilters({ ...filters, status: status as any })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.status === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.filterDivider} />
        
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Period:</Text>
          {['today', 'week', 'month', 'all'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.filterChip,
                filters.dateRange === range && styles.filterChipActive,
              ]}
              onPress={() => setFilters({ ...filters, dateRange: range as any })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.dateRange === range && styles.filterChipTextActive,
                ]}
              >
                {range === 'all' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isPast = new Date(item.scheduledDate) < new Date();
    const canAcceptDecline = item.status === 'pending' && !isPast;
    const canComplete = item.status === 'confirmed' && isPast;
    
    return (
      <Card
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
        margin="small"
        style={styles.bookingCard}
      >
        <View style={styles.bookingHeader}>
          <StatusBadge status={item.status} size="small" />
          <Text style={styles.bookingId}>#{item.id.slice(-6).toUpperCase()}</Text>
        </View>

        <View style={styles.devoteeInfo}>
          <UserAvatar
            source={{ uri: item.devotee.photoURL }}
            name={item.devotee.name}
            size="medium"
            title={item.devotee.name}
            subtitle={`${item.devotee.phoneNumber}`}
          />
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="flower" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>{item.service.serviceName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>
              {formatDate(new Date(item.scheduledDate), 'MMM d, yyyy')} at {item.scheduledTime}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.location.city}, {item.location.state} ({item.distanceFromPriest?.toFixed(1) || '?'} miles)
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>
              {formatPrice(item.totalAmount)} ({item.paymentStatus})
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {canAcceptDecline && (
            <>
              <OutlineButton
                title="Decline"
                onPress={() => {
                  setSelectedBooking(item);
                  setActionType('decline');
                  setShowActionModal(true);
                }}
                size="small"
                style={styles.actionButton}
              />
              <Button
                title="Accept"
                onPress={() => {
                  setSelectedBooking(item);
                  setActionType('accept');
                  setShowActionModal(true);
                }}
                size="small"
                style={styles.actionButton}
              />
            </>
          )}
          
          {canComplete && (
            <Button
              title="Mark Complete"
              onPress={() => {
                setSelectedBooking(item);
                setActionType('complete');
                setShowActionModal(true);
              }}
              size="small"
              fullWidth
            />
          )}
          
          {item.status === 'confirmed' && !isPast && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactDevotee(item)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              <Text style={styles.contactButtonText}>Message Devotee</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const renderStats = () => {
    const bookings = getFilteredBookings();
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const completed = bookings.filter(b => b.status === 'completed').length;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{confirmed}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')} style={styles.calendarButton}>
          <Ionicons name="calendar-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {renderStats()}
      {renderFilters()}

      {bookingState.loading ? (
        <InlineLoader text="Loading bookings..." />
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="calendar-outline"
            title="No bookings found"
            message="Try adjusting your filters or check back later"
            action={{
              label: 'Clear Filters',
              onPress: () => setFilters({ status: 'all', dateRange: 'week' }),
            }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <ConfirmationModal
        visible={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedBooking(null);
          setActionType(null);
        }}
        onConfirm={handleBookingAction}
        title={
          actionType === 'accept' ? 'Accept Booking?' :
          actionType === 'decline' ? 'Decline Booking?' :
          'Complete Booking?'
        }
        message={
          actionType === 'accept' ? 'You are confirming this booking. The devotee will be notified.' :
          actionType === 'decline' ? 'This booking will be cancelled. The devotee will be notified and refunded.' :
          'Mark this booking as completed? This will trigger the payment release process.'
        }
        confirmText={
          actionType === 'accept' ? 'Accept' :
          actionType === 'decline' ? 'Decline' :
          'Complete'
        }
        confirmButtonProps={{ loading: processing }}
        danger={actionType === 'decline'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.small,
  },
  headerTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  calendarButton: {
    padding: spacing.small,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    backgroundColor: colors.white,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
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
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filtersScroll: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginRight: spacing.small,
  },
  filterChip: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.xsmall,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    marginRight: spacing.small,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.gray[300],
    marginHorizontal: spacing.medium,
  },
  listContent: {
    paddingBottom: spacing.large,
  },
  bookingCard: {
    marginHorizontal: spacing.medium,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  bookingId: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  devoteeInfo: {
    marginBottom: spacing.medium,
  },
  bookingDetails: {
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  detailText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.small,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flex: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xsmall,
    paddingVertical: spacing.small,
    flex: 1,
  },
  contactButtonText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});