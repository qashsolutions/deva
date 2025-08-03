import { 
  Booking, 
  RefundTransaction, 
  RefundReason,
  CancellationPolicy 
} from '../../types';
import { functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { REFUND_POLICIES } from '../../config/stripe';

// Cloud function references
const createRefundFn = httpsCallable(functions, 'createRefund');
const processEmergencyRefundFn = httpsCallable(functions, 'processEmergencyRefund');
const calculateRefundAmountFn = httpsCallable(functions, 'calculateRefundAmount');

export class RefundService {
  // Calculate refund amount based on cancellation policy and timing
  static calculateRefundAmount(
    booking: Booking,
    cancellationPolicy: CancellationPolicy,
    cancellationDate: Date = new Date()
  ): {
    refundAmount: number;
    cancellationFee: number;
    refundPercentage: number;
    policyApplied: string;
  } {
    const serviceDate = new Date(booking.scheduling.date + 'T' + booking.scheduling.startTime);
    const hoursUntilService = (serviceDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60);
    
    // Check if it's within free cancellation period
    if (hoursUntilService >= cancellationPolicy.freeUntilHours) {
      return {
        refundAmount: booking.pricing.advanceAmount,
        cancellationFee: 0,
        refundPercentage: 100,
        policyApplied: 'Free cancellation period',
      };
    }
    
    // Check if it's past no-refund period
    if (hoursUntilService < cancellationPolicy.noRefundHours) {
      return {
        refundAmount: 0,
        cancellationFee: booking.pricing.advanceAmount,
        refundPercentage: 0,
        policyApplied: 'No refund period',
      };
    }
    
    // Find applicable tiered fee
    const applicableTier = cancellationPolicy.tieredFees
      .sort((a, b) => a.hoursBeforeService - b.hoursBeforeService)
      .find(tier => hoursUntilService >= tier.hoursBeforeService);
    
    if (applicableTier) {
      const cancellationFee = Math.round(
        booking.pricing.advanceAmount * (applicableTier.feePercentage / 100)
      );
      const refundAmount = booking.pricing.advanceAmount - cancellationFee;
      
      return {
        refundAmount,
        cancellationFee,
        refundPercentage: 100 - applicableTier.feePercentage,
        policyApplied: `${applicableTier.hoursBeforeService} hours before service policy`,
      };
    }
    
    // Default to no refund if no policy matches
    return {
      refundAmount: 0,
      cancellationFee: booking.pricing.advanceAmount,
      refundPercentage: 0,
      policyApplied: 'Default policy',
    };
  }

  // Process standard cancellation refund
  static async processCancellationRefund(
    booking: Booking,
    reason: RefundReason,
    cancellationPolicy: CancellationPolicy,
    initiatedBy: string,
    description?: string
  ): Promise<RefundTransaction> {
    try {
      const { refundAmount, cancellationFee, refundPercentage, policyApplied } = 
        this.calculateRefundAmount(booking, cancellationPolicy);
      
      if (refundAmount === 0) {
        // No refund due, just return a record
        return {
          id: `no_refund_${Date.now()}`,
          bookingId: booking.id,
          originalPaymentIntentId: booking.payment.stripePaymentIntentId!,
          refundAmount: 0,
          cancellationFee: booking.pricing.advanceAmount,
          netRefund: 0,
          reason,
          description: description || policyApplied,
          stripeRefundId: '',
          status: 'succeeded',
          initiatedBy,
          createdAt: new Date(),
          processedAt: new Date(),
        };
      }
      
      const result = await createRefundFn({
        paymentIntentId: booking.payment.stripePaymentIntentId,
        amount: refundAmount,
        reason: this.mapRefundReasonToStripe(reason),
        metadata: {
          bookingId: booking.id,
          cancellationFee,
          refundPercentage,
          policyApplied,
          initiatedBy,
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
        reason,
        description: description || policyApplied,
        stripeRefundId: data.stripeRefundId,
        status: 'succeeded',
        initiatedBy,
        createdAt: new Date(),
        processedAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  // Process emergency refund (full refund regardless of policy)
  static async processEmergencyRefund(
    booking: Booking,
    emergencyType: string,
    initiatedBy: string,
    approvedBy: string,
    description: string
  ): Promise<RefundTransaction> {
    try {
      const result = await processEmergencyRefundFn({
        paymentIntentId: booking.payment.stripePaymentIntentId,
        amount: booking.pricing.advanceAmount,
        emergencyType,
        metadata: {
          bookingId: booking.id,
          initiatedBy,
          approvedBy,
          description,
        },
      });
      
      const data = result.data as any;
      
      return {
        id: data.id,
        bookingId: booking.id,
        originalPaymentIntentId: booking.payment.stripePaymentIntentId!,
        refundAmount: booking.pricing.advanceAmount,
        cancellationFee: 0,
        netRefund: booking.pricing.advanceAmount,
        reason: 'emergency',
        description: `Emergency refund: ${emergencyType} - ${description}`,
        stripeRefundId: data.stripeRefundId,
        status: 'succeeded',
        initiatedBy,
        approvedBy,
        createdAt: new Date(),
        processedAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Failed to process emergency refund: ${error.message}`);
    }
  }

  // Check if cancellation qualifies for emergency exception
  static checkEmergencyException(
    reason: string,
    emergencyExceptions: string[]
  ): boolean {
    const normalizedReason = reason.toLowerCase();
    return emergencyExceptions.some(exception => 
      normalizedReason.includes(exception.toLowerCase())
    );
  }

  // Get refund status and details
  static async getRefundStatus(refundId: string): Promise<RefundTransaction | null> {
    const getRefundStatusFn = httpsCallable(functions, 'getRefundStatus');
    
    try {
      const result = await getRefundStatusFn({ refundId });
      const data = result.data as any;
      
      if (!data) return null;
      
      return {
        id: data.id,
        bookingId: data.metadata.bookingId,
        originalPaymentIntentId: data.payment_intent,
        refundAmount: data.amount,
        cancellationFee: data.metadata.cancellationFee || 0,
        netRefund: data.amount,
        reason: data.reason as RefundReason,
        stripeRefundId: data.id,
        status: this.mapStripeStatus(data.status),
        initiatedBy: data.metadata.initiatedBy,
        createdAt: new Date(data.created * 1000),
        processedAt: data.status === 'succeeded' ? new Date() : undefined,
        failureReason: data.failure_reason,
      };
    } catch (error: any) {
      console.error('Failed to get refund status:', error);
      return null;
    }
  }

  // Map internal refund reason to Stripe reason
  private static mapRefundReasonToStripe(reason: RefundReason): string {
    const reasonMap: Record<RefundReason, string> = {
      customer_request: 'requested_by_customer',
      priest_cancellation: 'fraudulent',
      dispute: 'disputed',
      emergency: 'requested_by_customer',
      service_not_completed: 'requested_by_customer',
    };
    
    return reasonMap[reason] || 'requested_by_customer';
  }

  // Map Stripe refund status to internal status
  private static mapStripeStatus(status: string): RefundTransaction['status'] {
    switch (status) {
      case 'pending':
        return 'pending';
      case 'succeeded':
        return 'succeeded';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  // Calculate priest's loss from cancellation
  static calculatePriestLoss(
    booking: Booking,
    refundAmount: number
  ): {
    totalLoss: number;
    advanceLoss: number;
    futureLoss: number;
  } {
    const advanceLoss = Math.round(
      refundAmount * (1 - (booking.pricing.platformFee / booking.pricing.advanceAmount))
    );
    
    const futureLoss = booking.pricing.remainingAmount;
    
    return {
      totalLoss: advanceLoss + futureLoss,
      advanceLoss,
      futureLoss,
    };
  }

  // Format refund details for display
  static formatRefundDetails(refund: RefundTransaction): string[] {
    const details = [
      `Refund amount: $${(refund.refundAmount / 100).toFixed(2)}`,
      `Cancellation fee: $${(refund.cancellationFee / 100).toFixed(2)}`,
      `Net refund: $${(refund.netRefund / 100).toFixed(2)}`,
      `Status: ${refund.status}`,
      `Processed: ${refund.processedAt?.toLocaleDateString() || 'Pending'}`,
    ];
    
    if (refund.failureReason) {
      details.push(`Failure reason: ${refund.failureReason}`);
    }
    
    return details;
  }
}