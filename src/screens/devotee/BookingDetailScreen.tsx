import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { DevoteeBookingsStackParamList } from '../../navigation/DevoteeNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Avatar, UserAvatar } from '../../components/common/Avatar';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Button, OutlineButton, IconButton } from '../../components/common/Button';
import { ConfirmationModal } from '../../components/common/Modal';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { useBooking } from '../../contexts/BookingContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice, formatDate, formatPhoneNumber } from '../../utils/formatters';
import { SERVICE_TYPES } from '../../config/constants';
import { Booking } from '../../types/booking';
import { cancelBooking } from '../../services/payments/refundService';

type NavigationProp = NativeStackNavigationProp<DevoteeBookingsStackParamList, 'BookingDetail'>;
type RoutePropType = RouteProp<DevoteeBookingsStackParamList, 'BookingDetail'>;

export const BookingDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { bookingId } = route.params;
  const { state: bookingState, updateBookingStatus } = useBooking();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      // Find booking in state
      const foundBooking = [...bookingState.upcomingBookings, ...bookingState.pastBookings]
        .find(b => b.id === bookingId);
      
      if (foundBooking) {
        setBooking(foundBooking);
      } else {
        // In real app, would fetch from Firestore
        Alert.alert('Error', 'Booking not found');
      }
    } catch (error) {
      console.error('Failed to load booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (booking?.priest.phoneNumber) {
      Linking.openURL(`tel:${booking.priest.phoneNumber}`);
    }
  };

  const handleMessage = () => {
    navigation.navigate('Messages', { bookingId });
  };

  const handleGetDirections = () => {
    if (booking?.location) {
      const address = encodeURIComponent(
        `${booking.location.address}, ${booking.location.city}, ${booking.location.state} ${booking.location.zipCode}`
      );
      const url = Platform.select({
        ios: `maps:?address=${address}`,
        android: `geo:0,0?q=${address}`,
      });
      Linking.openURL(url!);
    }
  };

  const handleShare = async () => {
    if (!booking) return;

    try {
      await Share.share({
        message: `Booking Details:\n\nService: ${booking.service.serviceName}\nPriest: ${booking.priest.name}\nDate: ${formatDate(new Date(booking.scheduledDate), 'MMMM d, yyyy')}\nTime: ${booking.scheduledTime}\nLocation: ${booking.location.address}`,
        title: 'Booking Details',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    
    setCancelling(true);
    
    try {
      const result = await cancelBooking(booking.id, 'USER_CANCELLED');
      
      if (result.success) {
        await updateBookingStatus(booking.id, 'cancelled');
        
        Alert.alert(
          'Booking Cancelled',
          result.refundAmount > 0
            ? `Your booking has been cancelled. A refund of ${formatPrice(result.refundAmount)} will be processed within 5-7 business days.`
            : 'Your booking has been cancelled.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to cancel booking. Please try again.');
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      Alert.alert('Error', 'An error occurred while cancelling the booking.');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const canCancel = () => {
    if (!booking || booking.status !== 'confirmed') return false;
    
    const now = new Date();
    const bookingDate = new Date(booking.scheduledDate);
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilBooking > 24; // Can cancel if more than 24 hours away
  };

  const getRefundAmount = () => {
    if (!booking) return 0;
    
    const now = new Date();
    const bookingDate = new Date(booking.scheduledDate);
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilBooking > 48) {
      return booking.totalAmount * 0.5; // Full deposit refund
    } else if (hoursUntilBooking > 24) {
      return booking.totalAmount * 0.25; // 50% of deposit
    }
    return 0;
  };

  if (loading) {
    return <PageLoader text="Loading booking details..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Booking not found</Text>
      </SafeAreaView>
    );
  }

  const isPastBooking = new Date(booking.scheduledDate) < new Date() || 
                        booking.status === 'completed' || 
                        booking.status === 'cancelled';

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Booking Details</Text>
      <IconButton
        icon={<Ionicons name="share-outline" size={24} color={colors.text.primary} />}
        onPress={handleShare}
        variant="ghost"
        accessibilityLabel="Share"
      />
    </View>
  );

  const renderStatusCard = () => (
    <Card margin="medium" style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <StatusBadge status={booking.status} />
        <Text style={styles.bookingId}>ID: {booking.id.slice(-8).toUpperCase()}</Text>
      </View>
      
      {booking.status === 'confirmed' && !isPastBooking && (
        <View style={styles.qrContainer}>
          <QRCode
            value={booking.id}
            size={120}
            backgroundColor={colors.white}
            color={colors.text.primary}
          />
          <Text style={styles.qrText}>Show this QR code to your priest</Text>
        </View>
      )}
      
      {booking.status === 'completed' && (
        <Text style={styles.completedText}>
          Service completed on {formatDate(new Date(booking.completedAt!), 'MMMM d, yyyy')}
        </Text>
      )}
      
      {booking.status === 'cancelled' && (
        <Text style={styles.cancelledText}>
          Cancelled on {formatDate(new Date(booking.cancelledAt!), 'MMMM d, yyyy')}
        </Text>
      )}
    </Card>
  );

  const renderServiceDetails = () => (
    <SectionCard title="Service Details" margin="medium">
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Service</Text>
        <Text style={styles.detailValue}>{booking.service.serviceName}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Date</Text>
        <Text style={styles.detailValue}>
          {formatDate(new Date(booking.scheduledDate), 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Time</Text>
        <Text style={styles.detailValue}>{booking.scheduledTime}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Duration</Text>
        <Text style={styles.detailValue}>{booking.duration} minutes</Text>
      </View>
      
      {booking.attendeeCount && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Attendees</Text>
          <Text style={styles.detailValue}>{booking.attendeeCount} people</Text>
        </View>
      )}
      
      {booking.additionalOptions && booking.additionalOptions.length > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Add-ons</Text>
          <View style={styles.addOns}>
            {booking.additionalOptions.map((option, index) => (
              <Badge key={index} label={option} size="small" variant="neutral" />
            ))}
          </View>
        </View>
      )}
    </SectionCard>
  );

  const renderPriestInfo = () => (
    <SectionCard title="Priest Information" margin="medium">
      <UserAvatar
        source={{ uri: booking.priest.photoURL }}
        name={booking.priest.name}
        size="large"
        title={booking.priest.name}
        subtitle={`${booking.priest.experience} years experience`}
        containerStyle={styles.priestInfo}
      />
      
      <View style={styles.contactButtons}>
        <OutlineButton
          title="Call"
          icon={<Ionicons name="call" size={20} color={colors.primary} />}
          onPress={handleCall}
          style={styles.contactButton}
        />
        <OutlineButton
          title="Message"
          icon={<Ionicons name="chatbubble" size={20} color={colors.primary} />}
          onPress={handleMessage}
          style={styles.contactButton}
        />
      </View>
    </SectionCard>
  );

  const renderLocationInfo = () => (
    <SectionCard title="Location" margin="medium">
      <View style={styles.locationInfo}>
        <Ionicons name="location" size={20} color={colors.gray[600]} />
        <Text style={styles.locationText}>
          {booking.location.address}{'\n'}
          {booking.location.city}, {booking.location.state} {booking.location.zipCode}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
        <Ionicons name="navigate" size={20} color={colors.primary} />
        <Text style={styles.directionsText}>Get Directions</Text>
      </TouchableOpacity>
    </SectionCard>
  );

  const renderPaymentInfo = () => (
    <SectionCard title="Payment Details" margin="medium">
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Base Service</Text>
        <Text style={styles.detailValue}>{formatPrice(booking.basePrice)}</Text>
      </View>
      
      {booking.additionalCharges > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Additional Services</Text>
          <Text style={styles.detailValue}>+{formatPrice(booking.additionalCharges)}</Text>
        </View>
      )}
      
      <View style={[styles.detailRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>{formatPrice(booking.totalAmount)}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.paymentStatusButton}
        onPress={() => navigation.navigate('PaymentStatus', { bookingId })}
      >
        <Ionicons name="card" size={20} color={colors.primary} />
        <Text style={styles.paymentStatusText}>View Payment Status</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    </SectionCard>
  );

  const renderActions = () => {
    if (booking.status === 'cancelled' || isPastBooking) return null;
    
    return (
      <View style={styles.actions}>
        {booking.status === 'confirmed' && (
          <>
            <OutlineButton
              title="Reschedule"
              onPress={() => navigation.navigate('Reschedule', { bookingId })}
              fullWidth
              style={styles.actionButton}
            />
            
            {canCancel() && (
              <Button
                title="Cancel Booking"
                variant="danger"
                onPress={() => setShowCancelModal(true)}
                fullWidth
                style={styles.actionButton}
              />
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStatusCard()}
        {renderServiceDetails()}
        {renderPriestInfo()}
        {renderLocationInfo()}
        {renderPaymentInfo()}
        {renderActions()}
      </ScrollView>
      
      <ConfirmationModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Booking?"
        message={
          getRefundAmount() > 0
            ? `You will receive a refund of ${formatPrice(getRefundAmount())}. This action cannot be undone.`
            : 'No refund will be issued for this cancellation. This action cannot be undone.'
        }
        confirmText="Yes, Cancel"
        confirmButtonProps={{ loading: cancelling }}
        danger
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
  scrollContent: {
    paddingBottom: spacing.xlarge,
  },
  statusCard: {
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.medium,
  },
  bookingId: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing.large,
  },
  qrText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.medium,
    textAlign: 'center',
  },
  completedText: {
    fontSize: fontSize.medium,
    color: colors.success,
    textAlign: 'center',
  },
  cancelledText: {
    fontSize: fontSize.medium,
    color: colors.error,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.small,
  },
  detailLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  addOns: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xsmall,
  },
  priestInfo: {
    marginBottom: spacing.medium,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  contactButton: {
    flex: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.medium,
  },
  locationText: {
    flex: 1,
    fontSize: fontSize.medium,
    color: colors.text.primary,
    marginLeft: spacing.small,
    lineHeight: fontSize.medium * 1.4,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.small,
    gap: spacing.small,
  },
  directionsText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing.small,
    paddingTop: spacing.medium,
  },
  totalLabel: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.medium,
    marginTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  paymentStatusText: {
    flex: 1,
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.small,
  },
  actions: {
    padding: spacing.medium,
    gap: spacing.medium,
  },
  actionButton: {
    marginBottom: 0,
  },
});