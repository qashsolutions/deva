import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ReviewForm } from '../../components/reviews/ReviewForm';
import { Card } from '../../components/common/Card';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../contexts/BookingContext';
import { colors, spacing, fontSize } from '../../config/theme';
import { formatDate } from '../../utils/formatters';
import { createReview, canReviewBooking } from '../../services/reviews';
import { ReviewPrompts } from '../../types/review';
import { Booking } from '../../types/booking';

// Define navigation params
type ReviewsStackParamList = {
  WriteReview: { bookingId: string };
};

type NavigationProp = NativeStackNavigationProp<ReviewsStackParamList, 'WriteReview'>;
type RoutePropType = RouteProp<ReviewsStackParamList, 'WriteReview'>;

export const WriteReviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { bookingId } = route.params;
  const { currentUser } = useAuth();
  const { state: bookingState } = useBooking();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    checkReviewEligibility();
  }, [bookingId]);

  const checkReviewEligibility = async () => {
    try {
      if (!currentUser) {
        navigation.goBack();
        return;
      }

      // Find booking
      const foundBooking = [...bookingState.upcomingBookings, ...bookingState.pastBookings]
        .find(b => b.id === bookingId);
      
      if (foundBooking) {
        setBooking(foundBooking);
        
        // Check if user can review
        const eligible = await canReviewBooking(currentUser.uid, bookingId);
        setCanReview(eligible);
        
        if (!eligible) {
          Alert.alert(
            'Cannot Write Review',
            'You can only review completed bookings that haven\'t been reviewed yet.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        Alert.alert('Error', 'Booking not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      Alert.alert('Error', 'Failed to load booking information');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (
    rating: number,
    comment: string,
    prompts?: ReviewPrompts
  ) => {
    if (!currentUser || !booking) return;

    setSubmitting(true);

    try {
      await createReview(currentUser.uid, {
        bookingId: booking.id,
        rating,
        comment,
      });

      Alert.alert(
        'Review Submitted!',
        'Thank you for your feedback. Your review helps others find the right priest.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Write Review</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderBookingInfo = () => {
    if (!booking) return null;

    return (
      <Card margin="medium" style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Ionicons name="flower" size={24} color={colors.primary} />
          <Text style={styles.bookingService}>{booking.service.serviceName}</Text>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>with {booking.priest.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>
              {formatDate(new Date(booking.scheduledDate), 'MMMM d, yyyy')}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <PageLoader text="Loading booking details..." />
      </SafeAreaView>
    );
  }

  if (!booking || !canReview) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to write review</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderBookingInfo()}
      
      <ReviewForm
        onSubmit={handleSubmitReview}
        onCancel={() => navigation.goBack()}
        loading={submitting}
        showPrompts={true}
        serviceName={booking.service.serviceName}
        priestName={booking.priest.name}
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
  placeholder: {
    width: 40,
  },
  bookingCard: {
    backgroundColor: colors.gray[50],
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    marginBottom: spacing.medium,
  },
  bookingService: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  bookingDetails: {
    gap: spacing.small,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  detailText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
});