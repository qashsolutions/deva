import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  CardField,
  useStripe,
  StripeProvider,
} from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice } from '../../utils/formatters';
import { validateEmail } from '../../utils/validation';

interface PaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentMethodId: string) => void;
  onError: (error: string) => void;
  loading?: boolean;
  saveCard?: boolean;
  customerEmail?: string;
  customerName?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onPaymentSuccess,
  onError,
  loading = false,
  saveCard = true,
  customerEmail = '',
  customerName = '',
}) => {
  const { createPaymentMethod } = useStripe();
  const [cardComplete, setCardComplete] = useState(false);
  const [email, setEmail] = useState(customerEmail);
  const [name, setName] = useState(customerName);
  const [saveForFuture, setSaveForFuture] = useState(saveCard);
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!cardComplete) {
      onError('Please enter complete card details');
      return;
    }

    if (!email || !validateEmail(email)) {
      onError('Please enter a valid email address');
      return;
    }

    if (!name.trim()) {
      onError('Please enter your name');
      return;
    }

    setProcessing(true);

    try {
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            email,
            name,
          },
        },
      });

      if (error) {
        onError(error.message || 'Failed to create payment method');
      } else if (paymentMethod) {
        onPaymentSuccess(paymentMethod.id);
      }
    } catch (error) {
      onError('An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Details</Text>
        <View style={styles.secureIndicator}>
          <Ionicons name="lock-closed" size={16} color={colors.success} />
          <Text style={styles.secureText}>Secure</Text>
        </View>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Amount to Pay</Text>
        <Text style={styles.amountValue}>{formatPrice(amount)}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Ionicons name="mail-outline" size={20} color={colors.gray[600]} />}
          error={email && !validateEmail(email) ? 'Invalid email' : undefined}
        />

        <Input
          label="Cardholder Name"
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
          autoCapitalize="words"
          icon={<Ionicons name="person-outline" size={20} color={colors.gray[600]} />}
        />

        <View style={styles.cardFieldContainer}>
          <Text style={styles.cardFieldLabel}>Card Information</Text>
          <CardField
            postalCodeEnabled={true}
            placeholders={{
              number: '4242 4242 4242 4242',
              cvc: 'CVC',
              expiry: 'MM/YY',
              postalCode: 'ZIP',
            }}
            cardStyle={{
              backgroundColor: colors.white,
              textColor: colors.text.primary,
              placeholderColor: colors.gray[400],
              borderRadius: borderRadius.medium,
              borderColor: colors.gray[300],
              borderWidth: 1,
              fontSize: 16,
            }}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
          <View style={styles.cardBrands}>
            <Ionicons name="card" size={24} color={colors.gray[400]} />
            <Text style={styles.cardBrandText}>Visa</Text>
            <Text style={styles.cardBrandText}>Mastercard</Text>
            <Text style={styles.cardBrandText}>Amex</Text>
          </View>
        </View>

        {saveCard && (
          <TouchableOpacity
            style={styles.saveCardOption}
            onPress={() => setSaveForFuture(!saveForFuture)}
          >
            <View style={[styles.checkbox, saveForFuture && styles.checkboxChecked]}>
              {saveForFuture && (
                <Ionicons name="checkmark" size={16} color={colors.white} />
              )}
            </View>
            <Text style={styles.saveCardText}>Save card for future payments</Text>
          </TouchableOpacity>
        )}
      </View>

      <Button
        title={`Pay ${formatPrice(amount)}`}
        onPress={handlePayment}
        loading={processing || loading}
        disabled={!cardComplete || !email || !name}
        fullWidth
        size="large"
        style={styles.payButton}
      />

      <View style={styles.securityInfo}>
        <Ionicons name="shield-checkmark" size={20} color={colors.gray[600]} />
        <Text style={styles.securityText}>
          Your payment info is encrypted and secure. We never store your card details.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  title: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  secureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  secureText: {
    fontSize: fontSize.small,
    color: colors.success,
    fontWeight: '600',
  },
  amountSection: {
    backgroundColor: colors.primary + '10',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.large,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  amountValue: {
    fontSize: fontSize.xxlarge,
    fontWeight: '700',
    color: colors.primary,
  },
  form: {
    gap: spacing.medium,
    marginBottom: spacing.large,
  },
  cardFieldContainer: {
    marginTop: spacing.small,
  },
  cardFieldLabel: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  cardField: {
    height: 50,
    marginBottom: spacing.small,
  },
  cardBrands: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  cardBrandText: {
    fontSize: fontSize.xsmall,
    color: colors.gray[500],
  },
  saveCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    paddingVertical: spacing.small,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.small,
    borderWidth: 2,
    borderColor: colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveCardText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  payButton: {
    marginBottom: spacing.medium,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.small,
  },
  securityText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
  },
});