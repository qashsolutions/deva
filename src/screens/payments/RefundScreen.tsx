import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, SectionCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { RefundStatus } from '../../components/payments/RefundStatus';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { useBooking } from '../../contexts/BookingContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice, formatDate } from '../../utils/formatters';
import { cancelBooking, getRefundAmount } from '../../services/payments/refundService';
import { Booking } from '../../types/booking';
import { Refund, RefundReason } from '../../types/payment';

// Define navigation params type
type RefundScreenParams = {
  Refund: { bookingId: string };
};

type NavigationProp = NativeStackNavigationProp<RefundScreenParams, 'Refund'>;
type RoutePropType = RouteProp<RefundScreenParams, 'Refund'>;

const REFUND_REASONS: { value: RefundReason; label: string; description: string }[] = [
  {
    value: 'USER_CANCELLED',
    label: 'Change of plans',
    description: 'My schedule changed and I can no longer attend',
  },
  {
    value: 'PRIEST_CANCELLED',
    label: 'Priest cancelled',
    description: 'The priest is no longer available',
  },
  {
    value: 'PRIEST_NO_SHOW',
    label: 'Priest didn\'t show up',
    description: 'The priest did not arrive for the ceremony',
  },
  {
    value: 'SERVICE_ISSUE',
    label: 'Service issue',
    description: 'There was a problem with the service provided',
  },
  {
    value: 'OTHER',
    label: 'Other reason',
    description: 'Another reason not listed above',
  },
];

export const RefundScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { bookingId } = route.params;
  const { state: bookingState, updateBookingStatus } = useBooking();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [selectedReason, setSelectedReason] = useState<RefundReason | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [existingRefund, setExistingRefund] = useState<Refund | null>(null);

  useEffect(() => {
    loadBookingAndRefundInfo();
  }, [bookingId]);

  const loadBookingAndRefundInfo = async () => {
    try {
      // Find booking in state
      const foundBooking = [...bookingState.upcomingBookings, ...bookingState.pastBookings]
        .find(b => b.id === bookingId);
      
      if (foundBooking) {
        setBooking(foundBooking);
        
        // Calculate refund amount
        const amount = getRefundAmount(foundBooking);
        setRefundAmount(amount);

        // Check if refund already exists
        if (foundBooking.refundId) {
          // In real app, would fetch refund details from Firestore
          setExistingRefund({
            id: foundBooking.refundId,
            bookingId: foundBooking.id,
            amount: amount,
            status: 'processing',
            reason: 'USER_CANCELLED',
            createdAt: new Date(),
            processedAt: new Date(),
          });
        }
      } else {
        Alert.alert('Error', 'Booking not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to load booking:', error);
      Alert.alert('Error', 'Failed to load booking information');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!booking || !selectedReason) return;

    Alert.alert(
      'Confirm Refund Request',
      `You will receive a refund of ${formatPrice(refundAmount)}. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: processRefund,
        },
      ]
    );
  };

  const processRefund = async () => {
    if (!booking || !selectedReason) return;

    setProcessing(true);

    try {
      const result = await cancelBooking(booking.id, selectedReason, additionalNotes);
      
      if (result.success) {
        await updateBookingStatus(booking.id, 'cancelled');
        
        Alert.alert(
          'Refund Initiated',
          `Your refund of ${formatPrice(refundAmount)} has been initiated. It will be processed within 5-7 business days.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Refund error:', error);
      Alert.alert('Error', 'An error occurred while processing your refund');
    } finally {
      setProcessing(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {existingRefund ? 'Refund Status' : 'Request Refund'}
      </Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderBookingInfo = () => {
    if (!booking) return null;

    return (
      <Card margin="medium" style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingTitle}>Booking Details</Text>
          <Badge label={`#${booking.id.slice(-6).toUpperCase()}`} size="small" />
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="flower" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>{booking.service.serviceName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>{booking.priest.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>
              {formatDate(new Date(booking.scheduledDate), 'MMM d, yyyy')} at {booking.scheduledTime}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>
              Paid: {formatPrice(booking.totalAmount)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderRefundPolicy = () => (
    <SectionCard title="Refund Policy" margin="medium">
      <View style={styles.policyItem}>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        <Text style={styles.policyText}>
          More than 48 hours before: 100% of deposit refunded
        </Text>
      </View>
      <View style={styles.policyItem}>
        <Ionicons name="checkmark-circle" size={20} color={colors.warning} />
        <Text style={styles.policyText}>
          24-48 hours before: 50% of deposit refunded
        </Text>
      </View>
      <View style={styles.policyItem}>
        <Ionicons name="close-circle" size={20} color={colors.error} />
        <Text style={styles.policyText}>
          Less than 24 hours: No refund available
        </Text>
      </View>
    </SectionCard>
  );

  const renderRefundAmount = () => (
    <Card margin="medium" style={styles.refundAmountCard}>
      <Text style={styles.refundAmountLabel}>Refund Amount</Text>
      <Text style={styles.refundAmountValue}>{formatPrice(refundAmount)}</Text>
      {refundAmount === 0 && (
        <Text style={styles.noRefundText}>
          Cancellations within 24 hours are not eligible for refunds
        </Text>
      )}
    </Card>
  );

  const renderReasonSelection = () => (
    <SectionCard title="Reason for Cancellation" margin="medium">
      {REFUND_REASONS.map((reason) => (
        <TouchableOpacity
          key={reason.value}
          style={[
            styles.reasonOption,
            selectedReason === reason.value && styles.reasonOptionSelected,
          ]}
          onPress={() => setSelectedReason(reason.value)}
        >
          <View style={styles.reasonRadio}>
            {selectedReason === reason.value && (
              <View style={styles.reasonRadioInner} />
            )}
          </View>
          <View style={styles.reasonContent}>
            <Text style={styles.reasonLabel}>{reason.label}</Text>
            <Text style={styles.reasonDescription}>{reason.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
      
      {selectedReason === 'OTHER' && (
        <TextInput
          style={styles.notesInput}
          placeholder="Please provide more details..."
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.gray[400]}
        />
      )}
    </SectionCard>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <PageLoader text="Loading refund information..." />
      </SafeAreaView>
    );
  }

  if (existingRefund) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderBookingInfo()}
          <RefundStatus
            refund={existingRefund}
            onContactSupport={() => Alert.alert('Support', 'Contact support@devebhyo.com')}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderBookingInfo()}
        {renderRefundPolicy()}
        {renderRefundAmount()}
        
        {refundAmount > 0 && renderReasonSelection()}
      </ScrollView>

      {refundAmount > 0 && (
        <View style={styles.footer}>
          <Button
            title="Request Refund"
            onPress={handleRequestRefund}
            loading={processing}
            disabled={!selectedReason || (selectedReason === 'OTHER' && !additionalNotes.trim())}
            fullWidth
            size="large"
          />
        </View>
      )}
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
  scrollContent: {
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: colors.gray[50],
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  bookingTitle: {
    fontSize: fontSize.medium,
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
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  policyText: {
    flex: 1,
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.4,
  },
  refundAmountCard: {
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
  },
  refundAmountLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  refundAmountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  noRefundText: {
    fontSize: fontSize.small,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.medium,
  },
  reasonOption: {
    flexDirection: 'row',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.small,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  reasonOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  reasonRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  reasonDescription: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    fontSize: fontSize.medium,
    color: colors.text.primary,
    marginTop: spacing.medium,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.large,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});