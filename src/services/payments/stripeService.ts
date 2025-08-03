import { StripeConfig } from '../../config/stripe';
import { 
  Booking, 
  PaymentIntent, 
  PaymentAmounts, 
  RefundTransaction,
  CancellationPolicy,
  PaymentError,
  User,
  PriestType
} from '../../types';
import { functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';

// Cloud function references
const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
const confirmPaymentFn = httpsCallable(functions, 'confirmPayment');
const holdEscrowFn = httpsCallable(functions, 'holdFundsInEscrow');
const releaseEscrowFn = httpsCallable(functions, 'releaseEscrowFunds');
const processRefundFn = httpsCallable(functions, 'processRefund');

export class StripeService {
  // Calculate payment amounts including splits
  static calculatePaymentAmounts(
    booking: Booking,
    priest: User,
    templeSharePercentage?: number
  ): PaymentAmounts {
    const { finalPrice, advanceAmount, retentionAmount } = booking.pricing;
    
    // Platform fee calculation
    const platformFee = Math.round(finalPrice * (StripeConfig.platformFeePercentage / 100));
    
    // Temple share calculation (if applicable)
    let templeShare = 0;
    if (priest.priestType === 'temple_employee' && templeSharePercentage) {
      templeShare = Math.round(finalPrice * (templeSharePercentage / 100));
    }
    
    // Priest earnings after fees
    const priestShare = finalPrice - platformFee - templeShare;
    
    return {
      total: finalPrice,
      advance: advanceAmount,
      remaining: finalPrice - advanceAmount,
      priestShare,
      templeShare: templeShare > 0 ? templeShare : undefined,
      platformFee,
      retentionAmount,
    };
  }

  // Create payment intent for advance payment
  static async createAdvancePayment(
    booking: Booking,
    priest: User,
    customerId?: string
  ): Promise<PaymentIntent> {
    try {
      const amounts = this.calculatePaymentAmounts(
        booking,
        priest,
        priest.templeSharePercentage
      );
      
      const result = await createPaymentIntentFn({
        bookingId: booking.id,
        devoteeId: booking.devoteeId,
        priestId: booking.priestId,
        amount: amounts.advance, // Charge only advance amount
        currency: StripeConfig.currency,
        customerId,
        metadata: {
          bookingId: booking.id,
          serviceType: booking.serviceDetails.type,
          priestName: priest.name,
          isAdvancePayment: true,
        },
        transferData: priest.stripeConnectAccountId ? {
          destination: priest.stripeConnectAccountId,
        } : undefined,
      });
      
      const data = result.data as any;
      
      return {
        id: data.id,
        bookingId: booking.id,
        devoteeId: booking.devoteeId,
        priestId: booking.priestId,
        amounts,
        stripeData: {
          paymentIntentId: data.paymentIntentId,
          transferGroupId: data.transferGroupId,
          connectAccountId: priest.stripeConnectAccountId,
          clientSecret: data.clientSecret,
          ephemeralKey: data.ephemeralKey,
          customerId: data.customerId,
        },
        status: 'requires_payment',
        createdAt: new Date(),
      };
    } catch (error: any) {
      throw this.handleStripeError(error);
    }
  }

  // Confirm payment after user completes payment
  static async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<PaymentIntent> {
    try {
      const result = await confirmPaymentFn({
        paymentIntentId,
        paymentMethodId,
      });
      
      return result.data as PaymentIntent;
    } catch (error: any) {
      throw this.handleStripeError(error);
    }
  }

  // Hold funds in escrow until service completion
  static async holdFundsInEscrow(paymentIntentId: string): Promise<void> {
    try {
      await holdEscrowFn({
        paymentIntentId,
        holdDays: StripeConfig.escrowHoldDays,
      });
    } catch (error: any) {
      throw this.handleStripeError(error);
    }
  }

  // Release escrow funds to priest after service
  static async releaseEscrowFunds(
    bookingId: string,
    priestId: string,
    templeId?: string
  ): Promise<any[]> {
    try {
      const result = await releaseEscrowFn({
        bookingId,
        priestId,
        templeId,
      });
      
      return result.data as any[];
    } catch (error: any) {
      throw this.handleStripeError(error);
    }
  }

  // Process cancellation refund based on policy
  static async processCancellationRefund(
    booking: Booking,
    cancellationPolicy: CancellationPolicy,
    reason: string
  ): Promise<RefundTransaction> {
    try {
      const hoursUntilService = this.calculateHoursUntilService(booking.scheduling.date);
      const refundPercentage = this.calculateRefundPercentage(
        hoursUntilService,
        cancellationPolicy
      );
      
      const refundAmount = Math.round(booking.pricing.advanceAmount * (refundPercentage / 100));
      const cancellationFee = booking.pricing.advanceAmount - refundAmount;
      
      const result = await processRefundFn({
        bookingId: booking.id,
        paymentIntentId: booking.payment.stripePaymentIntentId,
        refundAmount,
        reason,
        metadata: {
          cancellationFee,
          hoursUntilService,
          refundPercentage,
        },
      });
      
      const data = result.data as any;
      
      return {
        id: data.id,
        bookingId: booking.id,
        originalPaymentIntentId: booking.payment.stripePaymentIntentId!,
        refundAmount,
        cancellationFee,
        netRefund: refundAmount,
        reason: reason as any,
        stripeRefundId: data.stripeRefundId,
        status: 'succeeded',
        initiatedBy: booking.devoteeId,
        createdAt: new Date(),
        processedAt: new Date(),
      };
    } catch (error: any) {
      throw this.handleStripeError(error);
    }
  }

  // Calculate hours until service
  private static calculateHoursUntilService(serviceDate: string): number {
    const now = new Date();
    const service = new Date(serviceDate);
    const diffMs = service.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60));
  }

  // Calculate refund percentage based on cancellation policy
  private static calculateRefundPercentage(
    hoursUntilService: number,
    policy: CancellationPolicy
  ): number {
    // Check if within free cancellation period
    if (hoursUntilService >= policy.freeUntilHours) {
      return 100;
    }
    
    // Check if past no-refund period
    if (hoursUntilService < policy.noRefundHours) {
      return 0;
    }
    
    // Find applicable tier
    const applicableTier = policy.tieredFees
      .sort((a, b) => b.hoursBeforeService - a.hoursBeforeService)
      .find(tier => hoursUntilService >= tier.hoursBeforeService);
    
    if (applicableTier) {
      return 100 - applicableTier.feePercentage;
    }
    
    return 0;
  }

  // Handle Stripe errors
  private static handleStripeError(error: any): PaymentError {
    const errorCode = error.code || error.data?.code || 'unknown_error';
    const errorMessage = error.message || error.data?.message || 'Payment processing failed';
    
    return {
      code: errorCode,
      message: this.getUserFriendlyErrorMessage(errorCode, errorMessage),
      type: this.getErrorType(errorCode),
      param: error.param,
      declineCode: error.decline_code,
    };
  }

  // Get user-friendly error message
  private static getUserFriendlyErrorMessage(code: string, defaultMessage: string): string {
    const errorMessages: Record<string, string> = {
      card_declined: 'Your card was declined. Please try a different payment method.',
      insufficient_funds: 'Your card has insufficient funds.',
      incorrect_cvc: 'Your card\'s security code is incorrect.',
      expired_card: 'Your card has expired.',
      processing_error: 'An error occurred while processing your card. Please try again.',
      rate_limit: 'Too many requests. Please try again later.',
      authentication_required: 'Your card requires authentication. Please follow the instructions.',
    };
    
    return errorMessages[code] || defaultMessage;
  }

  // Get error type
  private static getErrorType(code: string): PaymentError['type'] {
    if (code.startsWith('card_')) return 'card_error';
    if (code === 'authentication_required') return 'authentication_error';
    if (['rate_limit', 'api_key_expired'].includes(code)) return 'api_error';
    return 'validation_error';
  }

  // Create setup intent for saving payment methods
  static async createSetupIntent(customerId: string): Promise<any> {
    const createSetupIntentFn = httpsCallable(functions, 'createSetupIntent');
    
    try {
      const result = await createSetupIntentFn({ customerId });
      return result.data;
    } catch (error: any) {
      throw this.handleStripeError(error);
    }
  }

  // List customer payment methods
  static async listPaymentMethods(customerId: string): Promise<any[]> {
    const listPaymentMethodsFn = httpsCallable(functions, 'listPaymentMethods');
    
    try {
      const result = await listPaymentMethodsFn({ customerId });
      return result.data as any[];
    } catch (error: any) {
      throw this.handleStripeError(error);
    }
  }
}