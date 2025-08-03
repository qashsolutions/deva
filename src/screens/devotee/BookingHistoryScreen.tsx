import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DevoteeBookingsStackParamList } from '../../navigation/DevoteeNavigator';
import { Card } from '../../components/common/Card';
import { Avatar, UserAvatar } from '../../components/common/Avatar';
import { StatusBadge } from '../../components/common/Badge';
import { CompactRating } from '../../components/common/Rating';
import { NoBookingsEmptyState } from '../../components/common/EmptyState';
import { InlineLoader } from '../../components/common/LoadingSpinner';
import { useBooking } from '../../contexts/BookingContext';
import { colors, spacing, fontSize } from '../../config/theme';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Booking } from '../../types/booking';
import { SERVICE_TYPES } from '../../config/constants';

type NavigationProp = NativeStackNavigationProp<DevoteeBookingsStackParamList, 'BookingHistory'>;

interface BookingSection {
  title: string;
  data: Booking[];
}

export const BookingHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state: bookingState, loadBookingHistory } = useBooking();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await loadBookingHistory();
    } catch (error) {
      console.error('Failed to load booking history:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate('BookingDetail', { bookingId: booking.id });
  };

  const getBookingSections = (): BookingSection[] => {
    const now = new Date();
    const allBookings = [...bookingState.upcomingBookings, ...bookingState.pastBookings];
    
    let filteredBookings = allBookings;
    
    if (filter === 'upcoming') {
      filteredBookings = allBookings.filter(b => 
        new Date(b.scheduledDate) >= now && b.status !== 'cancelled'
      );
    } else if (filter === 'past') {
      filteredBookings = allBookings.filter(b => 
        new Date(b.scheduledDate) < now || b.status === 'completed' || b.status === 'cancelled'
      );
    }

    // Group by month
    const sections: { [key: string]: Booking[] } = {};
    
    filteredBookings.forEach(booking => {
      const monthYear = formatDate(new Date(booking.scheduledDate), 'MMMM yyyy');
      if (!sections[monthYear]) {
        sections[monthYear] = [];
      }
      sections[monthYear].push(booking);
    });

    // Convert to array and sort
    return Object.entries(sections)
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => {
        const dateA = new Date(a.data[0].scheduledDate);
        const dateB = new Date(b.data[0].scheduledDate);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {[
        { id: 'all', label: 'All' },
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'past', label: 'Past' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.filterTab,
            filter === tab.id && styles.filterTabActive,
          ]}
          onPress={() => setFilter(tab.id as any)}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === tab.id && styles.filterTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const isPast = new Date(item.scheduledDate) < new Date() || 
                   item.status === 'completed' || 
                   item.status === 'cancelled';
    
    return (
      <Card
        onPress={() => handleBookingPress(item)}
        margin="small"
        style={[styles.bookingCard, isPast && styles.bookingCardPast]}
      >
        <View style={styles.bookingHeader}>
          <UserAvatar
            source={{ uri: item.priest.photoURL }}
            name={item.priest.name}
            size="medium"
            title={item.priest.name}
            subtitle={SERVICE_TYPES.find(s => s.id === item.service.serviceType)?.name || item.service.serviceName}
          />
          <StatusBadge status={item.status} size="small" />
        </View>

        <View style={styles.bookingInfo}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={16} color={colors.gray[600]} />
              <Text style={styles.infoText}>
                {formatDate(new Date(item.scheduledDate), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={colors.gray[600]} />
              <Text style={styles.infoText}>{item.scheduledTime}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color={colors.gray[600]} />
              <Text style={styles.infoText} numberOfLines={1}>
                {item.location.city}, {item.location.state}
              </Text>
            </View>
            <Text style={styles.price}>{formatPrice(item.totalAmount)}</Text>
          </View>
        </View>

        {item.status === 'completed' && !item.review && (
          <TouchableOpacity
            style={styles.reviewPrompt}
            onPress={() => navigation.navigate('WriteReview', { bookingId: item.id })}
          >
            <Ionicons name="star-outline" size={20} color={colors.primary} />
            <Text style={styles.reviewPromptText}>Write a Review</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {item.review && (
          <View style={styles.reviewDisplay}>
            <CompactRating value={item.review.rating} size="small" />
            <Text style={styles.reviewText} numberOfLines={1}>
              "{item.review.comment}"
            </Text>
          </View>
        )}

        {item.status === 'confirmed' && new Date(item.scheduledDate) > new Date() && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Messages', { bookingId: item.id })}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Reschedule', { bookingId: item.id })}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  const renderSectionHeader = ({ section }: { section: BookingSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>{section.data.length} bookings</Text>
    </View>
  );

  const sections = getBookingSections();
  const hasBookings = sections.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {renderFilterTabs()}
      
      {bookingState.loading ? (
        <InlineLoader text="Loading bookings..." />
      ) : hasBookings ? (
        <SectionList
          sections={sections}
          renderItem={renderBookingCard}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <NoBookingsEmptyState
          message={
            filter === 'upcoming'
              ? "You don't have any upcoming bookings"
              : filter === 'past'
              ? "You don't have any past bookings"
              : "You haven't made any bookings yet"
          }
          action={{
            label: 'Find Priests',
            onPress: () => navigation.getParent()?.navigate('SearchTab' as any),
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.small,
    alignItems: 'center',
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingTop: spacing.large,
    paddingBottom: spacing.small,
  },
  sectionTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionCount: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  bookingCard: {
    marginHorizontal: spacing.medium,
  },
  bookingCardPast: {
    opacity: 0.8,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.medium,
  },
  bookingInfo: {
    gap: spacing.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
    flex: 1,
  },
  infoText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  price: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.medium,
    marginTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  reviewPromptText: {
    flex: 1,
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.small,
  },
  reviewDisplay: {
    paddingTop: spacing.medium,
    marginTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing.xsmall,
  },
  reviewText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.medium,
    paddingTop: spacing.medium,
    marginTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xsmall,
    paddingVertical: spacing.small,
  },
  actionButtonText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
});