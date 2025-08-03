import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { DevoteeSearchStackParamList } from '../../navigation/DevoteeNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Button, OutlineButton } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ConfirmationModal } from '../../components/common/Modal';
import { useBooking } from '../../contexts/BookingContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice } from '../../utils/formatters';
import { STRIPE_PUBLISHABLE_KEY } from '../../config/stripe';
import { createPaymentIntent, processPayment } from '../../services/payments/stripeService';
import { Booking } from '../../types/booking';

type NavigationProp = NativeStackNavigationProp<DevoteeSearchStackParamList, 'Payment'>;
type RoutePropType = RouteProp<DevoteeSearchStackParamList, 'Payment'>;

interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  isDefault?: boolean;
}

export const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { bookingId, amount } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { state: bookingState, updateBookingStatus } = useBooking();
  const { state: userState } = useUser();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [useCredits, setUseCredits] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const loyaltyCredits = userState.profile?.userType === 'devotee'
    ? userState.profile.devoteeProfile?.loyaltyPoints || 0
    : 0;
  const creditValue = loyaltyCredits / 100; // $1 = 100 points
  const creditDiscount = Math.min(creditValue, amount * 0.1); // Max 10% discount
  const finalAmount = amount - (useCredits ? creditDiscount : 0);

  useEffect(() => {
    loadPaymentData();
  }, [bookingId]);

  const loadPaymentData = async () => {
    try {
      // Load booking details
      const bookingData = bookingState.activeBookings.find(b => b.id === bookingId);
      if (bookingData) {
        setBooking(bookingData);
      }

      // Load payment methods (mock data)
      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: 'pm_1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          isDefault: true,
        },
      ];
      setPaymentMethods(mockPaymentMethods);
      setSelectedPaymentMethod(mockPaymentMethods[0]);

      // Initialize payment sheet
      const { paymentIntent, ephemeralKey, customer } = await createPaymentIntent({
        amount: finalAmount,
        currency: 'usd',
        customerId: userState.profile?.id || '',
      });

      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Devebhyo',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: `${userState.profile?.firstName} ${userState.profile?.lastName}`,
          email: userState.profile?.email,
        },
      });

      if (error) {
        console.error('Payment sheet init error:', error);
        Alert.alert('Error', 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Load payment data error:', error);
      Alert.alert('Error', 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Present payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', error.message);
        }
      } else {
        // Payment successful
        await updateBookingStatus(bookingId, 'confirmed');
        
        // Update loyalty points if credits were used
        if (useCredits && creditDiscount > 0) {
          // Deduct loyalty points
          // This would be handled by a cloud function in real implementation
        }

        // Show success and navigate
        Alert.alert(
          'Payment Successful',
          'Your booking has been confirmed!',
          [
            {
              text: 'View Booking',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'Search' },
                  ],
                });
                navigation.navigate('BookingDetail' as any, { bookingId });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPaymentMethod = () => {
    // In real app, this would open Stripe's add card flow
    Alert.alert('Coming Soon', 'Add payment method functionality coming soon!');
  };

  if (loading) {
    return <PageLoader text="Loading payment information..." />;
  }

  const renderPaymentMethods = () => (
    <SectionCard
      title="Payment Method"
      headerAction={
        <TouchableOpacity onPress={handleAddPaymentMethod}>
          <Text style={styles.addMethodText}>Add New</Text>
        </TouchableOpacity>
      }
      margin="medium"
    >
      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentMethod,
            selectedPaymentMethod?.id === method.id && styles.paymentMethodSelected,
          ]}
          onPress={() => setSelectedPaymentMethod(method)}
        >
          <View style={styles.paymentMethodIcon}>
            {method.type === 'card' && (
              <Ionicons name="card" size={24} color={colors.gray[600]} />
            )}
          </View>
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodBrand}>
              {method.brand} •••• {method.last4}
            </Text>
            {method.isDefault && (
              <Badge label="Default" size="small" variant="neutral" />
            )}
          </View>
          {selectedPaymentMethod?.id === method.id && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity style={styles.paymentMethod} onPress={handleAddPaymentMethod}>
        <View style={styles.paymentMethodIcon}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </View>
        <Text style={styles.addPaymentMethodText}>Add Payment Method</Text>
      </TouchableOpacity>
    </SectionCard>
  );

  const renderLoyaltyCredits = () => {
    if (loyaltyCredits <= 0) return null;

    return (
      <SectionCard title="Loyalty Credits" margin="medium">
        <TouchableOpacity
          style={styles.creditsContainer}
          onPress={() => setUseCredits(!useCredits)}
        >
          <View style={styles.creditsInfo}>
            <Text style={styles.creditsTitle}>
              Use {loyaltyCredits} loyalty points
            </Text>
            <Text style={styles.creditsSubtitle}>
              Save {formatPrice(creditDiscount)} on this booking
            </Text>
          </View>
          <View style={[styles.toggle, useCredits && styles.toggleActive]}>
            <View style={[styles.toggleThumb, useCredits && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      </SectionCard>
    );
  };

  const renderPriceSummary = () => (
    <SectionCard title="Payment Summary" margin="medium">
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Service Total</Text>
        <Text style={styles.summaryValue}>{formatPrice(amount)}</Text>
      </View>
      
      {useCredits && creditDiscount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Loyalty Discount</Text>
          <Text style={styles.discountValue}>-{formatPrice(creditDiscount)}</Text>
        </View>
      )}
      
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>{formatPrice(finalAmount)}</Text>
      </View>
      
      <View style={styles.depositNote}>
        <Ionicons name="information-circle" size={16} color={colors.info} />
        <Text style={styles.depositNoteText}>
          50% deposit ({formatPrice(finalAmount / 2)}) will be charged now.
          Remaining balance due after service completion.
        </Text>
      </View>
    </SectionCard>
  );

  const renderSecurityInfo = () => (
    <View style={styles.securityInfo}>
      <Ionicons name="shield-checkmark" size={20} color={colors.success} />
      <Text style={styles.securityText}>
        Your payment information is encrypted and secure
      </Text>
    </View>
  );

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderPaymentMethods()}
          {renderLoyaltyCredits()}
          {renderPriceSummary()}
          {renderSecurityInfo()}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={`Pay ${formatPrice(finalAmount / 2)} Deposit`}
            onPress={() => setShowConfirmation(true)}
            loading={processing}
            disabled={!selectedPaymentMethod}
            fullWidth
            size="large"
          />
          <Text style={styles.termsText}>
            By proceeding, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Refund Policy</Text>
          </Text>
        </View>

        <ConfirmationModal
          visible={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={() => {
            setShowConfirmation(false);
            handlePayment();
          }}
          title="Confirm Payment"
          message={`You will be charged ${formatPrice(finalAmount / 2)} as a deposit. The remaining balance of ${formatPrice(finalAmount / 2)} will be due after the service is completed.`}
          confirmText="Confirm & Pay"
          confirmButtonProps={{ loading: processing }}
        />
      </SafeAreaView>
    </StripeProvider>
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
    flexGrow: 1,
    paddingBottom: spacing.large,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    marginBottom: spacing.small,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  paymentMethodSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodBrand: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  addMethodText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  addPaymentMethodText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditsInfo: {
    flex: 1,
  },
  creditsTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  creditsSubtitle: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gray[300],
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.small,
  },
  summaryLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  discountValue: {
    fontSize: fontSize.medium,
    color: colors.success,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing.small,
    paddingTop: spacing.medium,
  },
  totalLabel: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
  depositNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '10',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginTop: spacing.medium,
  },
  depositNoteText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.small,
    lineHeight: fontSize.small * 1.4,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    marginHorizontal: spacing.medium,
  },
  securityText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.small,
  },
  footer: {
    padding: spacing.large,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  termsText: {
    fontSize: fontSize.xsmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.medium,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});