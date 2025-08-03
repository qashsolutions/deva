import { 
  Booking, 
  User, 
  PaymentSplit, 
  LoyaltyCredit,
  PricingBreakdown 
} from '../../types';
import { StripeConfig, PAYMENT_SPLITS } from '../../config/stripe';
import { functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import * as firestoreService from '../firestore';

// Cloud function references
const scheduleEscrowReleaseFn = httpsCallable(functions, 'scheduleEscrowRelease');
const processLoyaltyRetentionFn = httpsCallable(functions, 'processLoyaltyRetention');
const releaseEscrowEarlyFn = httpsCallable(functions, 'releaseEscrowEarly');

export class EscrowService {
  // Calculate payment splits based on priest type and agreements
  static calculatePaymentSplit(
    booking: Booking,
    priest: User
  ): PaymentSplit {
    const { finalPrice, retentionAmount } = booking.pricing;
    const amountAfterRetention = finalPrice - retentionAmount;
    
    // Platform fee calculation
    const platformAmount = Math.round(amountAfterRetention * (PAYMENT_SPLITS.PLATFORM_FEE / 100));
    const platformPercentage = PAYMENT_SPLITS.PLATFORM_FEE;
    
    // Temple share calculation
    let templeAmount = 0;
    let templePercentage = 0;
    
    if (priest.priestType === 'temple_employee' && priest.templeSharePercentage) {
      templePercentage = priest.templeSharePercentage;
      templeAmount = Math.round(amountAfterRetention * (templePercentage / 100));
    }
    
    // Priest earnings calculation
    const priestAmount = amountAfterRetention - platformAmount - templeAmount;
    const priestPercentage = 100 - platformPercentage - templePercentage;
    
    return {
      priestAmount,
      templeAmount,
      platformAmount,
      retentionAmount,
      priestPercentage,
      templePercentage,
      platformPercentage,
    };
  }

  // Schedule automatic escrow release after service completion
  static async scheduleEscrowRelease(
    bookingId: string,
    releaseDate: Date
  ): Promise<void> {
    try {
      await scheduleEscrowReleaseFn({
        bookingId,
        releaseDate: releaseDate.toISOString(),
        escrowHoldDays: StripeConfig.escrowHoldDays,
      });
    } catch (error: any) {
      throw new Error(`Failed to schedule escrow release: ${error.message}`);
    }
  }

  // Process early escrow release for trusted priests
  static async releaseEscrowEarly(
    bookingId: string,
    priestId: string
  ): Promise<void> {
    try {
      // Check if priest is eligible for early release
      const priest = await firestoreService.getUser(priestId);
      if (!priest) throw new Error('Priest not found');
      
      const isEligible = await this.checkEarlyReleaseEligibility(priest);
      if (!isEligible) {
        throw new Error('Priest not eligible for early escrow release');
      }
      
      await releaseEscrowEarlyFn({
        bookingId,
        priestId,
        reason: 'trusted_priest',
      });
    } catch (error: any) {
      throw new Error(`Failed to release escrow early: ${error.message}`);
    }
  }

  // Process loyalty credit retention
  static async processLoyaltyRetention(bookingId: string): Promise<LoyaltyCredit> {
    try {
      const booking = await firestoreService.getBooking(bookingId);
      if (!booking) throw new Error('Booking not found');
      
      const result = await processLoyaltyRetentionFn({
        bookingId,
        devoteeId: booking.devoteeId,
        priestId: booking.priestId,
        retentionAmount: booking.pricing.retentionAmount,
      });
      
      const data = result.data as any;
      
      return {
        id: data.id,
        devoteeId: booking.devoteeId,
        priestId: booking.priestId,
        bookingId,
        amount: data.amount,
        originalAmount: data.amount,
        usedAmount: 0,
        remainingAmount: data.amount,
        earnedAt: new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        status: 'active',
        usageHistory: [],
      };
    } catch (error: any) {
      throw new Error(`Failed to process loyalty retention: ${error.message}`);
    }
  }

  // Calculate pricing breakdown with all fees and splits
  static calculatePricingBreakdown(
    basePrice: number,
    advancePercentage: number,
    retentionAmount: number,
    distance: number = 0,
    travelFeePerMile?: number,
    appliedCredits: number = 0
  ): PricingBreakdown {
    // Calculate travel fee if applicable
    const travelFee = travelFeePerMile ? Math.round(distance * travelFeePerMile * 100) / 100 : 0;
    
    // Subtotal before any discounts
    const subtotal = basePrice + travelFee;
    
    // Apply loyalty credits
    const discountApplied = Math.min(appliedCredits, subtotal);
    
    // Final price after discounts
    const finalPrice = subtotal - discountApplied;
    
    // Calculate advance and remaining amounts
    const advanceAmount = Math.round(finalPrice * (advancePercentage / 100));
    const remainingAmount = finalPrice - advanceAmount;
    
    // Calculate fees and splits
    const platformFee = Math.round(finalPrice * (PAYMENT_SPLITS.PLATFORM_FEE / 100));
    
    return {
      servicePrice: basePrice,
      travelFee,
      materialsFee: 0, // Can be added if needed
      discountApplied,
      loyaltyCredit: appliedCredits,
      subtotal,
      platformFee,
      templeShare: 0, // Will be calculated based on priest type
      priestEarnings: finalPrice - platformFee - retentionAmount,
      finalPrice,
      advanceAmount,
      remainingAmount,
      retentionAmount,
    };
  }

  // Check if priest is eligible for early escrow release
  private static async checkEarlyReleaseEligibility(priest: User): Promise<boolean> {
    // Criteria for early release eligibility:
    // 1. Priest has completed at least 10 bookings
    // 2. Rating is 4.5 or higher
    // 3. No recent disputes or cancellations
    // 4. Account is verified and in good standing
    
    if (!priest.rating || priest.rating < 4.5) return false;
    if (!priest.reviewCount || priest.reviewCount < 10) return false;
    if (!priest.isVerified) return false;
    
    // Check recent booking history
    const recentBookings = await firestoreService.getUserBookings(
      priest.id,
      'priest',
      { pageSize: 20 }
    );
    
    const cancelledCount = recentBookings.filter(b => b.status === 'cancelled').length;
    const cancellationRate = cancelledCount / recentBookings.length;
    
    // Less than 10% cancellation rate
    if (cancellationRate > 0.1) return false;
    
    return true;
  }

  // Get available loyalty credits for a devotee-priest pair
  static async getAvailableLoyaltyCredits(
    devoteeId: string,
    priestId: string
  ): Promise<LoyaltyCredit[]> {
    // This would be implemented in firestore service
    // For now, returning empty array
    return [];
  }

  // Apply loyalty credits to a booking
  static async applyLoyaltyCredits(
    bookingId: string,
    creditIds: string[],
    totalAmount: number
  ): Promise<number> {
    // This would update the loyalty credits and return the applied amount
    // Implementation would be in a cloud function
    return 0;
  }

  // Calculate estimated payout date
  static calculatePayoutDate(serviceCompletionDate: Date): Date {
    const payoutDate = new Date(serviceCompletionDate);
    payoutDate.setDate(payoutDate.getDate() + StripeConfig.escrowHoldDays);
    
    // If payout date falls on weekend, move to next Monday
    const dayOfWeek = payoutDate.getDay();
    if (dayOfWeek === 0) { // Sunday
      payoutDate.setDate(payoutDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday
      payoutDate.setDate(payoutDate.getDate() + 2);
    }
    
    return payoutDate;
  }

  // Format payout schedule for display
  static formatPayoutSchedule(
    advanceAmount: number,
    remainingAmount: number,
    serviceDate: Date
  ): string[] {
    const payoutDate = this.calculatePayoutDate(serviceDate);
    
    return [
      `Advance payment: $${(advanceAmount / 100).toFixed(2)} (Paid at booking)`,
      `Remaining payment: $${(remainingAmount / 100).toFixed(2)} (Due on service completion)`,
      `Estimated payout: ${payoutDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })}`,
    ];
  }
}