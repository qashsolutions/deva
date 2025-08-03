export type PaymentStatus = 
  | 'requires_payment'
  | 'processing'
  | 'held_in_escrow'
  | 'partially_released'
  | 'completed'
  | 'refunded'
  | 'failed';

export type ConnectAccountStatus = 'pending' | 'restricted' | 'enabled';

export type RefundReason = 
  | 'customer_request'
  | 'priest_cancellation'
  | 'dispute'
  | 'emergency'
  | 'service_not_completed';

export interface PaymentAmounts {
  total: number;
  advance: number;
  remaining: number;
  priestShare: number;
  templeShare?: number;
  platformFee: number;
  retentionAmount: number;
}

export interface StripeData {
  paymentIntentId: string;
  transferGroupId: string;
  connectAccountId?: string;
  clientSecret?: string;
  ephemeralKey?: string;
  customerId?: string;
}

export interface PaymentIntent {
  id: string;
  bookingId: string;
  devoteeId: string;
  priestId: string;
  
  amounts: PaymentAmounts;
  stripeData: StripeData;
  
  status: PaymentStatus;
  escrowReleaseDate?: Date;
  
  // Payment method
  paymentMethod?: {
    id: string;
    type: string;
    last4?: string;
    brand?: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  releasedAt?: Date;
  
  // Error handling
  lastError?: {
    code: string;
    message: string;
    timestamp: Date;
  };
}

export interface ConnectAccount {
  id: string;
  priestId: string;
  stripeAccountId: string;
  
  accountStatus: ConnectAccountStatus;
  requiresInfo: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    errors: Array<{
      code: string;
      reason: string;
      requirement: string;
    }>;
  };
  
  capabilities: {
    cardPayments: 'active' | 'inactive' | 'pending';
    transfers: 'active' | 'inactive' | 'pending';
  };
  
  bankAccount?: {
    last4: string;
    bankName?: string;
    currency: string;
  };
  
  businessProfile?: {
    name?: string;
    url?: string;
    supportPhone?: string;
    supportEmail?: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  onboardingCompletedAt?: Date;
  
  // Payout schedule
  payoutSchedule?: {
    interval: 'daily' | 'weekly' | 'monthly';
    weeklyAnchor?: string;
    monthlyAnchor?: number;
  };
}

export interface RefundTransaction {
  id: string;
  bookingId: string;
  originalPaymentIntentId: string;
  
  refundAmount: number;
  cancellationFee: number;
  netRefund: number;
  
  reason: RefundReason;
  description?: string;
  
  stripeRefundId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  
  initiatedBy: string; // User ID
  approvedBy?: string; // Admin ID if manual approval needed
  
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export interface Transfer {
  id: string;
  bookingId: string;
  paymentIntentId: string;
  
  amount: number;
  currency: string;
  
  destinationAccountId: string; // Stripe Connect account ID
  destinationType: 'priest' | 'temple';
  
  stripeTransferId: string;
  transferGroupId: string;
  
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'reversed';
  
  createdAt: Date;
  availableOn: Date;
  paidAt?: Date;
  
  metadata: {
    priestId: string;
    priestName: string;
    serviceType: string;
    bookingDate: string;
  };
}

export interface LoyaltyCredit {
  id: string;
  devoteeId: string;
  priestId: string;
  bookingId: string;
  
  amount: number;
  originalAmount: number;
  usedAmount: number;
  remainingAmount: number;
  
  earnedAt: Date;
  expiresAt?: Date;
  
  status: 'active' | 'partially_used' | 'fully_used' | 'expired';
  
  usageHistory: Array<{
    bookingId: string;
    amountUsed: number;
    usedAt: Date;
  }>;
}

export interface PaymentSplit {
  priestAmount: number;
  templeAmount: number;
  platformAmount: number;
  retentionAmount: number;
  
  priestPercentage: number;
  templePercentage: number;
  platformPercentage: number;
}

export interface PaymentError {
  code: string;
  message: string;
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error';
  param?: string;
  declineCode?: string;
}