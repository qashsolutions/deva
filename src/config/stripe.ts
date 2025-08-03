export const StripeConfig = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  merchantIdentifier: 'merchant.com.priestconnect.app',
  
  // Connect configuration
  connectClientId: process.env.EXPO_PUBLIC_STRIPE_CONNECT_CLIENT_ID || '',
  
  // Webhook endpoints
  webhookEndpoint: process.env.EXPO_PUBLIC_WEBHOOK_ENDPOINT || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  // Payment settings
  currency: 'usd',
  minimumBookingAmount: 2500, // $25.00 in cents
  platformFeePercentage: 5,   // 5% platform fee
  
  // Escrow settings
  escrowHoldDays: 1,          // Hold funds for 1 day after service
  autoReleaseEnabled: true,   // Auto-release for trusted priests
  
  // Payment method types
  paymentMethodTypes: ['card', 'us_bank_account'],
  
  // Apple Pay & Google Pay
  applePay: {
    merchantIdentifier: 'merchant.com.priestconnect.app',
    merchantCountryCode: 'US',
  },
  googlePay: {
    merchantName: 'PriestConnect',
    testEnvironment: process.env.NODE_ENV !== 'production',
  },
} as const;

// Stripe error codes
export const STRIPE_ERROR_CODES = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  AUTHENTICATION_REQUIRED: 'authentication_required',
  EXPIRED_CARD: 'expired_card',
  INCORRECT_CVC: 'incorrect_cvc',
  PROCESSING_ERROR: 'processing_error',
  RATE_LIMIT: 'rate_limit_error',
} as const;

// Connect account requirements
export const CONNECT_REQUIREMENTS = {
  INDIVIDUAL: [
    'individual.first_name',
    'individual.last_name',
    'individual.email',
    'individual.phone',
    'individual.dob',
    'individual.ssn_last_4',
    'individual.address',
    'tos_acceptance',
    'bank_account',
  ],
  COMPANY: [
    'company.name',
    'company.tax_id',
    'company.address',
    'representative.first_name',
    'representative.last_name',
    'representative.email',
    'representative.phone',
    'representative.dob',
    'representative.ssn_last_4',
    'tos_acceptance',
    'bank_account',
  ],
} as const;

// Payment split configurations
export const PAYMENT_SPLITS = {
  TEMPLE_EMPLOYEE_DEFAULT: 30, // 30% to temple
  PLATFORM_FEE: 5, // 5% platform fee
  LOYALTY_RETENTION_DEFAULT: 25, // $25 default retention
} as const;

// Refund policies
export const REFUND_POLICIES = {
  FREE_CANCELLATION_HOURS: 48,
  TIERED_FEES: [
    { hoursBeforeService: 48, feePercentage: 0 },
    { hoursBeforeService: 24, feePercentage: 25 },
    { hoursBeforeService: 12, feePercentage: 50 },
    { hoursBeforeService: 0, feePercentage: 100 },
  ],
} as const;

// Stripe webhook events
export const STRIPE_WEBHOOK_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  CHARGE_DISPUTE_CREATED: 'charge.dispute.created',
  ACCOUNT_UPDATED: 'account.updated',
  TRANSFER_CREATED: 'transfer.created',
  TRANSFER_PAID: 'transfer.paid',
  REFUND_CREATED: 'refund.created',
  PAYOUT_CREATED: 'payout.created',
  PAYOUT_PAID: 'payout.paid',
  PAYOUT_FAILED: 'payout.failed',
} as const;