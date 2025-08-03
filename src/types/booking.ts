import { ServiceOffering } from './service';
import { User } from './user';

export type BookingStatus = 
  | 'quote_requested'
  | 'quote_provided'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type MessageType = 'text' | 'quote' | 'system' | 'image';

export interface ServiceDetails {
  type: string;
  name: string;
  description: string;
  duration: number;
  specialRequests?: string;
  attendeeCount?: number;
}

export interface SchedulingInfo {
  date: string; // ISO date string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  travelDistance?: number; // in miles
}

export interface PricingBreakdown {
  servicePrice: number;
  travelFee?: number;
  materialsFee?: number;
  discountApplied: number;
  loyaltyCredit?: number;
  subtotal: number;
  platformFee: number;
  templeShare?: number;
  priestEarnings: number;
  finalPrice: number;
  advanceAmount: number;
  remainingAmount: number;
  retentionAmount: number;
}

export interface PaymentInfo {
  stripePaymentIntentId?: string;
  advancePaid: boolean;
  advancePaidAt?: Date;
  completionPaid: boolean;
  completionPaidAt?: Date;
  refundAmount?: number;
  refundedAt?: Date;
  paymentMethod?: string;
  last4?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: MessageType;
  metadata?: {
    quoteAmount?: number;
    imageUrl?: string;
  };
  isRead: boolean;
}

export interface Review {
  rating: number;
  comment: string;
  timestamp: Date;
  reviewerName: string;
}

export interface Booking {
  id: string;
  devoteeId: string;
  priestId: string;
  serviceId: string;
  
  // Service information
  serviceDetails: ServiceDetails;
  serviceOffering?: ServiceOffering; // Full service details
  
  // Scheduling
  scheduling: SchedulingInfo;
  
  // Pricing
  pricing: PricingBreakdown;
  
  // Payment
  payment: PaymentInfo;
  
  // Status
  status: BookingStatus;
  statusHistory: Array<{
    status: BookingStatus;
    timestamp: Date;
    reason?: string;
  }>;
  
  // Cancellation
  cancellationReason?: string;
  cancellationFee?: number;
  cancelledBy?: 'devotee' | 'priest' | 'system';
  cancelledAt?: Date;
  
  // Communication
  messages: Message[];
  lastMessageAt?: Date;
  unreadMessagesCount: {
    devotee: number;
    priest: number;
  };
  
  // Quote details (if applicable)
  quoteRequest?: {
    requestedAt: Date;
    requirements: string;
    proposedBudget?: number;
    preferredDates?: string[];
  };
  quoteProvided?: {
    providedAt: Date;
    amount: number;
    validUntil: Date;
    customTerms?: string;
  };
  
  // Reviews
  reviews?: {
    devoteeReview?: Review;
    priestReview?: Review;
  };
  
  // References
  devotee?: User;
  priest?: User;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Flags
  isUrgent?: boolean;
  isRepeatCustomer?: boolean;
  hasDispute?: boolean;
}

export interface BookingRequest {
  devoteeId: string;
  priestId: string;
  serviceId: string;
  serviceDetails: ServiceDetails;
  scheduling: Omit<SchedulingInfo, 'travelDistance'>;
  quoteRequest?: {
    requirements: string;
    proposedBudget?: number;
    preferredDates?: string[];
  };
}

export interface QuoteResponse {
  bookingId: string;
  amount: number;
  validUntil: Date;
  customTerms?: string;
  breakdown?: Partial<PricingBreakdown>;
}

export interface BookingFilter {
  status?: BookingStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  priestId?: string;
  devoteeId?: string;
  serviceType?: string;
  minAmount?: number;
  maxAmount?: number;
}