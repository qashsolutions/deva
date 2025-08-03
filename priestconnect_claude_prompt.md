# PriestConnect - React Native Implementation Guide

## Business Context

**PriestConnect** is a marketplace app connecting Hindu devotees in the US with qualified priests for religious ceremonies. The app addresses the shortage of available priests by enabling part-time priests (working professionals) to offer weekend services.

### Target Market
- **Devotees**: US-based Hindu families needing priests for home ceremonies, festivals, weddings
- **Priests**: Three types with different revenue sharing models:
  - **Temple Employee**: Shares percentage with temple (e.g., 30% to temple)
  - **Temple Owner**: Keeps all earnings, manages other priests
  - **Independent**: Part-time priests, keeps all earnings minus platform fee

### Core Business Model
- Priests set their own pricing, payment terms, and cancellation policies
- Flexible pricing: fixed, range-based, or quote-on-request
- Loyalty system: priests retain portion of payment for customer discounts
- Location-based matching within ZIP code radius
- Advance payment with completion-based release

## Technical Specifications

### Tech Stack
- **Framework**: React Native with Expo (iOS, Android, Web)
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **Payments**: Stripe Connect (priest payouts, escrow, refunds)
- **Maps/Location**: Google Maps API / Places API
- **Push Notifications**: Expo Notifications
- **State Management**: React Context + useReducer
- **Navigation**: React Navigation 6
- **Styling**: Tailwind-like utility classes (NativeWind or custom)

### Code Quality Standards
- **File Size Limit**: Maximum 250 lines per file
- **Import Strategy**: Extract components/utilities when files exceed limit
- **No Hardcoding**: All constants in configuration files
- **No TODOs**: Complete, production-ready code only
- **No Deprecated**: Use latest stable APIs and patterns
- **Modern UI/UX**: Contemporary design patterns, micro-interactions, accessibility

### Modern UI/UX Requirements
- **Design System**: Consistent spacing, typography, colors
- **Micro-Interactions**: Loading states, button feedback, smooth transitions
- **Accessibility**: Screen reader support, proper contrast, touch targets
- **Responsive Design**: Works on phones, tablets, web
- **Dark Mode Support**: System preference detection
- **Haptic Feedback**: iOS/Android native feedback
- **Skeleton Loading**: Content placeholders while loading
- **Pull-to-Refresh**: Native refresh patterns
- **Swipe Gestures**: Modern mobile interactions

## User Journey Mapping

### Devotee Journey
1. **Onboarding**: Phone auth → Profile setup → Location permission
2. **Discovery**: Search by ZIP → Filter by service/language → View priests
3. **Selection**: Compare up to 2 priests → View availability → Request quotes
4. **Booking**: Select service → Choose time → Enter details → Pay advance
5. **Management**: Track bookings → Message priest → Rate/review → Rebook

### Priest Journey
1. **Onboarding**: Phone auth → Select priest type → Temple association (if applicable)
2. **Setup**: Add services → Set pricing/terms → Configure availability
3. **Operations**: Manage calendar → Respond to quotes → Track earnings
4. **Growth**: Build reputation → Manage loyal customers → Optimize pricing

### Business Rules
- **Availability Modification**: Priests can modify calendar up to 3 days before
- **Priest Selection Limit**: Devotees can select maximum 2 priests for comparison
- **Payment Flow**: Advance payment → Escrow → Release after service completion
- **Cancellation**: Priest-defined policies with emergency exceptions
- **Loyalty System**: Priests retain configurable amount for repeat customer discounts

## Stripe Payment Architecture

### Payment Flow Requirements
The app requires a sophisticated payment system handling:
- **Advance payments** with escrow holding
- **Multi-party payouts** (priest, temple, platform)
- **Flexible cancellation refunds** based on priest policies
- **Loyalty credit retention** for repeat customers
- **Connect accounts** for priest payouts

### Stripe Integration Models

#### Core Payment Data Models
```typescript
interface PaymentIntent {
  id: string;
  bookingId: string;
  devoteeId: string;
  priestId: string;
  
  amounts: {
    total: number;           // Total booking amount
    advance: number;         // Upfront payment
    remaining: number;       // Due on completion
    priestShare: number;     // After temple/platform fees
    templeShare?: number;    // If temple-affiliated priest
    platformFee: number;     // App commission
    retentionAmount: number; // For loyalty credits
  };
  
  stripeData: {
    paymentIntentId: string;
    transferGroupId: string;
    connectAccountId?: string; // Priest's Connect account
    clientSecret: string;
  };
  
  status: 'requires_payment' | 'processing' | 'held_in_escrow' | 'partially_released' | 'completed' | 'refunded';
  escrowReleaseDate?: Date;
  createdAt: Date;
}

interface ConnectAccount {
  priestId: string;
  stripeAccountId: string;
  accountStatus: 'pending' | 'restricted' | 'enabled';
  requiresInfo: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: string[];
  createdAt: Date;
}

interface RefundTransaction {
  id: string;
  bookingId: string;
  originalPaymentIntentId: string;
  refundAmount: number;
  cancellationFee: number;
  reason: 'customer_request' | 'priest_cancellation' | 'dispute' | 'emergency';
  stripeRefundId: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: Date;
}
```

### Stripe Service Implementation Structure

#### Core Services
```typescript
// services/payments/stripeService.ts
class StripeService {
  // Payment Intent creation with escrow
  async createAdvancePayment(booking: Booking): Promise<PaymentIntent>
  
  // Confirm payment after user interaction
  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent>
  
  // Hold funds in escrow until service completion
  async holdFundsInEscrow(paymentIntentId: string): Promise<void>
  
  // Release funds to priest after service
  async releaseEscrowFunds(bookingId: string): Promise<Transfer[]>
  
  // Handle cancellation refunds
  async processCancellationRefund(bookingId: string, cancellationPolicy: CancellationPolicy): Promise<RefundTransaction>
}

// services/payments/connectService.ts
class StripeConnectService {
  // Create Connect account for priest
  async createConnectAccount(priestId: string, priestType: PriestType): Promise<ConnectAccount>
  
  // Generate Connect onboarding link
  async createOnboardingLink(stripeAccountId: string): Promise<string>
  
  // Check account status and requirements
  async getAccountStatus(stripeAccountId: string): Promise<AccountStatus>
  
  // Create transfers to priest accounts
  async createTransfer(amount: number, stripeAccountId: string, transferGroup: string): Promise<Transfer>
}

// services/payments/escrowService.ts
class EscrowService {
  // Calculate payment splits based on priest type
  calculatePaymentSplit(booking: Booking, priest: User): PaymentSplit
  
  // Schedule escrow release after service completion
  scheduleEscrowRelease(bookingId: string, releaseDate: Date): Promise<void>
  
  // Handle early release for trusted priests
  releaseEscrowEarly(bookingId: string, priestId: string): Promise<void>
  
  // Manage loyalty credit retention
  processLoyaltyRetention(bookingId: string): Promise<LoyaltyCredit>
}
```

### Payment Components Architecture

#### Payment Flow Components
```typescript
// components/payments/PaymentForm.tsx
interface PaymentFormProps {
  booking: Booking;
  onPaymentSuccess: (paymentIntent: PaymentIntent) => void;
  onPaymentError: (error: PaymentError) => void;
}

// Key features:
// - Stripe Elements integration
// - Apple Pay/Google Pay support
// - Saved payment method selection
// - Real-time payment validation
// - Loading states and error handling

// components/payments/ConnectOnboarding.tsx
interface ConnectOnboardingProps {
  priestId: string;
  onOnboardingComplete: (accountId: string) => void;
  onOnboardingError: (error: string) => void;
}

// Key features:
// - Stripe Connect Express onboarding
// - KYC document collection
// - Bank account verification
// - Tax information collection
// - Compliance requirement tracking

// components/payments/EarningsCard.tsx
interface EarningsCardProps {
  priestId: string;
  timeRange: 'week' | 'month' | 'year';
  showBreakdown: boolean;
}

// Key features:
// - Real-time earnings display
// - Temple share breakdown (if applicable)
// - Platform fee transparency
// - Payout schedule information
// - Tax document access
```

### Payment Security & Compliance

#### Security Measures
```typescript
// PCI Compliance
// - Never store card data on device/server
// - Use Stripe Elements for card collection
// - Implement 3D Secure for authentication
// - Encrypt all payment-related data in transit

// Fraud Prevention
// - Device fingerprinting
// - Velocity checks for unusual booking patterns
// - Address verification for high-value bookings
// - Machine learning fraud detection via Stripe Radar

// Data Protection
// - Tokenize all payment methods
// - Implement proper session management
// - Log all payment activities for audit
// - GDPR compliance for EU users
```

#### Webhook Handling
```typescript
// services/payments/webhookService.ts
class WebhookService {
  // Handle successful payments
  async handlePaymentSucceeded(event: StripeEvent): Promise<void>
  
  // Handle failed payments
  async handlePaymentFailed(event: StripeEvent): Promise<void>
  
  // Handle Connect account updates
  async handleAccountUpdated(event: StripeEvent): Promise<void>
  
  // Handle transfer completion
  async handleTransferPaid(event: StripeEvent): Promise<void>
  
  // Handle refund completion
  async handleRefundCreated(event: StripeEvent): Promise<void>
  
  // Handle dispute notifications
  async handleChargeDispute(event: StripeEvent): Promise<void>
}
```

## Data Models

#### Payment Flow Patterns
```typescript
// Advance Payment Flow
const processAdvancePayment = async (booking: Booking) => {
  // 1. Calculate payment split
  const paymentSplit = EscrowService.calculatePaymentSplit(booking);
  
  // 2. Create PaymentIntent with escrow
  const paymentIntent = await StripeService.createAdvancePayment(booking);
  
  // 3. Present payment UI to user
  const result = await PaymentForm.collectPayment(paymentIntent.clientSecret);
  
  // 4. Confirm payment and hold in escrow
  if (result.status === 'succeeded') {
    await EscrowService.holdFundsInEscrow(paymentIntent.id);
    await BookingService.confirmBooking(booking.id);
  }
};

// Service Completion Flow
const completeServicePayment = async (bookingId: string) => {
  // 1. Verify service completion
  const booking = await BookingService.markAsCompleted(bookingId);
  
  // 2. Process loyalty retention
  const loyaltyCredit = await EscrowService.processLoyaltyRetention(bookingId);
  
  // 3. Release funds to priest/temple
  const transfers = await EscrowService.releaseEscrowFunds(bookingId);
  
  // 4. Update booking status
  await BookingService.updatePaymentStatus(bookingId, 'completed');
};
```

#### Error Handling Patterns
```typescript
// Comprehensive error handling for payments
const handlePaymentError = (error: StripeError) => {
  switch (error.code) {
    case 'card_declined':
      return 'Your card was declined. Please try a different payment method.';
    case 'insufficient_funds':
      return 'Insufficient funds. Please check your account balance.';
    case 'authentication_required':
      return 'Please authenticate with your bank to complete this payment.';
    default:
      return 'Payment failed. Please try again or contact support.';
  }
};
```

## Stripe Payment Architecture

### User Profile
```typescript
interface User {
  id: string;
  phone: string;
  userType: 'priest' | 'devotee';
  name: string;
  email?: string;
  profileImage?: string;
  location: {
    zipCode: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Priest-specific
  priestType?: 'temple_employee' | 'temple_owner' | 'independent';
  templeId?: string;
  templeName?: string;
  templeSharePercentage?: number;
  languages?: string[];
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  
  // Devotee-specific
  preferredLanguages?: string[];
  savedAddresses?: Array<{
    label: string;
    address: string;
    coordinates: { lat: number; lng: number };
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Service Offering
```typescript
interface ServiceOffering {
  id: string;
  priestId: string;
  serviceType: string;
  description: string;
  duration: number; // minutes
  
  pricing: {
    type: 'fixed' | 'range' | 'quote_request';
    fixedPrice?: number;
    priceRange?: { min: number; max: number };
    seasonalPricing?: boolean;
    bulkDiscounts?: Array<{ bookings: number; discountPercentage: number }>;
  };
  
  paymentTerms: {
    advancePercentage: number; // 25, 50, 75, 100
    retentionAmount: number; // amount kept for customer loyalty
    acceptsPartialPayment: boolean;
  };
  
  cancellationPolicy: {
    freeUntilHours: number;
    tieredFees: Array<{ hoursBeforeService: number; feePercentage: number }>;
    noRefundHours: number;
    emergencyExceptions: string[];
  };
  
  travelIncluded: boolean;
  maxTravelDistance: number; // miles
  materialsIncluded: string[];
  isActive: boolean;
  createdAt: Date;
}
```

### Booking
```typescript
interface Booking {
  id: string;
  devoteeId: string;
  priestId: string;
  serviceId: string;
  
  serviceDetails: {
    type: string;
    description: string;
    duration: number;
    specialRequests?: string;
  };
  
  scheduling: {
    date: string; // ISO date
    startTime: string;
    endTime: string;
    timezone: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  
  pricing: {
    servicePrice: number;
    discountApplied: number;
    finalPrice: number;
    advanceAmount: number;
    remainingAmount: number;
    retentionAmount: number;
    platformFee: number;
    templeShare?: number;
  };
  
  payment: {
    stripePaymentIntentId: string;
    advancePaid: boolean;
    completionPaid: boolean;
    refundAmount?: number;
    paymentMethod: string;
  };
  
  status: 'quote_requested' | 'quote_provided' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  cancellationReason?: string;
  cancellationFee?: number;
  
  communication: {
    messages: Array<{
      senderId: string;
      message: string;
      timestamp: Date;
      type: 'text' | 'quote' | 'system';
    }>;
  };
  
  reviews?: {
    devoteeReview?: { rating: number; comment: string; timestamp: Date };
    priestReview?: { rating: number; comment: string; timestamp: Date };
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Availability Slot
```typescript
interface AvailabilitySlot {
  id: string;
  priestId: string;
  date: string; // YYYY-MM-DD
  timeSlots: Array<{
    startTime: string; // HH:MM
    endTime: string;
    isAvailable: boolean;
    bookingId?: string;
  }>;
  canModify: boolean; // based on 3-day rule
  createdAt: Date;
}
```

## File Structure & Implementation Plan

### Phase 1: Core Infrastructure
```
src/
├── config/
│   ├── constants.ts          # App constants, service types, languages
│   ├── firebase.ts           # Firebase configuration
│   ├── stripe.ts            # Stripe configuration
│   └── theme.ts             # Design system tokens
├── types/
│   ├── user.ts              # User-related TypeScript interfaces
│   ├── booking.ts           # Booking-related interfaces
│   └── service.ts           # Service-related interfaces
├── utils/
│   ├── validation.ts        # Input validation functions
│   ├── dateUtils.ts         # Date/time utilities
│   ├── locationUtils.ts     # ZIP code, distance calculations
│   └── formatters.ts        # Price, phone, name formatting
```

### Phase 2: Authentication & Navigation
```
├── contexts/
│   ├── AuthContext.tsx      # Authentication state management
│   ├── UserContext.tsx      # User profile state
│   └── BookingContext.tsx   # Booking flow state
├── services/
│   ├── auth.ts              # Firebase Auth functions
│   ├── firestore.ts         # Database operations
│   ├── payments.ts          # Stripe integration
│   └── notifications.ts     # Push notification setup
├── navigation/
│   ├── AppNavigator.tsx     # Main navigation controller
│   ├── AuthNavigator.tsx    # Authentication flow
│   ├── PriestNavigator.tsx  # Priest-specific navigation
│   └── DevoteeNavigator.tsx # Devotee-specific navigation
```

### Phase 3: Common Components
```
├── components/
│   ├── common/
│   │   ├── Button.tsx           # Primary/secondary button variants
│   │   ├── Input.tsx            # Text input with validation
│   │   ├── LoadingSpinner.tsx   # Loading states
│   │   ├── Modal.tsx            # Modal/bottom sheet
│   │   ├── Card.tsx             # Content cards
│   │   ├── Avatar.tsx           # User profile images
│   │   ├── Rating.tsx           # Star rating component
│   │   ├── Badge.tsx            # Status badges
│   │   └── EmptyState.tsx       # Empty list states
```

### Phase 4: Authentication Screens
```
├── screens/
│   ├── auth/
│   │   ├── WelcomeScreen.tsx        # App introduction
│   │   ├── PhoneAuthScreen.tsx      # Phone number input
│   │   ├── OTPScreen.tsx            # OTP verification
│   │   ├── UserTypeScreen.tsx       # Priest vs Devotee selection
│   │   ├── PriestTypeScreen.tsx     # Temple/Independent selection
│   │   └── ProfileSetupScreen.tsx   # Initial profile creation
```

### Phase 5: Devotee Features
```
│   ├── devotee/
│   │   ├── DashboardScreen.tsx      # Home with quick search
│   │   ├── SearchScreen.tsx         # Priest search & filters
│   │   ├── PriestDetailScreen.tsx   # Priest profile & calendar
│   │   ├── BookingFlowScreen.tsx    # Service selection & booking
│   │   ├── PaymentScreen.tsx        # Stripe payment processing
│   │   ├── BookingHistoryScreen.tsx # Past/upcoming bookings
│   │   ├── BookingDetailScreen.tsx  # Individual booking details
│   │   └── ProfileScreen.tsx        # User settings & preferences
├── components/
│   ├── devotee/
│   │   ├── PriestCard.tsx           # Priest list item
│   │   ├── ServiceFilter.tsx        # Search filters
│   │   ├── BookingCard.tsx          # Booking list item
│   │   ├── PaymentSummary.tsx       # Payment breakdown
│   │   ├── ReviewForm.tsx           # Rating & review form
│   │   └── LocationPicker.tsx       # Address input with maps
```

### Phase 6: Priest Features
```
│   ├── priest/
│   │   ├── DashboardScreen.tsx      # Earnings & upcoming bookings
│   │   ├── ServicesScreen.tsx       # Manage service offerings
│   │   ├── AvailabilityScreen.tsx   # Calendar management
│   │   ├── BookingRequestsScreen.tsx# Quote requests & bookings
│   │   ├── EarningsScreen.tsx       # Financial dashboard
│   │   ├── ProfileScreen.tsx        # Priest profile management
│   │   └── TempleMgmtScreen.tsx     # Temple association (if applicable)
├── components/
│   ├── priest/
│   │   ├── ServiceCard.tsx          # Service offering item
│   │   ├── AvailabilityCalendar.tsx # Calendar with time slots
│   │   ├── BookingRequestCard.tsx   # Quote request item
│   │   ├── EarningsChart.tsx        # Revenue visualization
│   │   ├── PricingSetup.tsx         # Service pricing form
│   │   ├── PolicySetup.tsx          # Cancellation policy form
│   │   └── QuoteForm.tsx            # Custom quote response
```

### Phase 7: Payment Integration
```
├── services/
│   ├── payments/
│   │   ├── stripeService.ts         # Core Stripe operations
│   │   ├── connectService.ts        # Stripe Connect for priests
│   │   ├── escrowService.ts         # Payment holding & release
│   │   ├── refundService.ts         # Cancellation & refund logic
│   │   └── webhookService.ts        # Stripe webhook handlers
├── components/
│   ├── payments/
│   │   ├── PaymentForm.tsx          # Credit card input (Stripe Elements)
│   │   ├── PaymentMethod.tsx        # Saved payment methods
│   │   ├── ConnectOnboarding.tsx    # Priest Stripe Connect setup
│   │   ├── EarningsCard.tsx         # Priest earnings display
│   │   ├── RefundStatus.tsx         # Refund tracking component
│   │   └── PaymentHistory.tsx       # Transaction history
├── screens/
│   ├── payments/
│   │   ├── PaymentScreen.tsx        # Main payment flow
│   │   ├── ConnectSetupScreen.tsx   # Priest payout setup
│   │   ├── RefundScreen.tsx         # Cancellation & refunds
│   │   └── EarningsScreen.tsx       # Priest financial dashboard
```

### Phase 8: Advanced Features
```
├── components/
│   ├── messaging/
│   │   ├── ChatScreen.tsx           # In-app messaging
│   │   ├── MessageBubble.tsx        # Individual message
│   │   └── QuoteMessage.tsx         # Special quote message type
│   ├── maps/
│   │   ├── PriestMap.tsx           # Map view of nearby priests
│   │   └── RouteMap.tsx            # Priest travel route
│   └── analytics/
│       ├── BookingAnalytics.tsx    # Booking trends (priest)
│       └── SpendingAnalytics.tsx   # Spending insights (devotee)
```

### Stripe Configuration & Setup

#### Environment Configuration
```typescript
// config/stripe.ts
export const StripeConfig = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.priestconnect.app',
  
  // Connect configuration
  connectClientId: process.env.EXPO_PUBLIC_STRIPE_CONNECT_CLIENT_ID,
  
  // Webhook endpoints
  webhookEndpoint: process.env.EXPO_PUBLIC_WEBHOOK_ENDPOINT,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Payment settings
  currency: 'usd',
  minimumBookingAmount: 2500, // $25.00 in cents
  platformFeePercentage: 5,   // 5% platform fee
  
  // Escrow settings
  escrowHoldDays: 1,          // Hold funds for 1 day after service
  autoReleaseEnabled: true,   // Auto-release for trusted priests
};

// Firebase Functions configuration for server-side Stripe
export const ServerStripeConfig = {
  secretKey: functions.config().stripe.secret_key,
  webhookSecret: functions.config().stripe.webhook_secret,
  connectWebhookSecret: functions.config().stripe.connect_webhook_secret,
};
```

#### React Native Stripe Setup
```typescript
// App.tsx - Initialize Stripe
import { StripeProvider } from '@stripe/stripe-react-native';
import { StripeConfig } from './config/stripe';

export default function App() {
  return (
    <StripeProvider
      publishableKey={StripeConfig.publishableKey}
      merchantIdentifier={StripeConfig.merchantIdentifier}
      urlScheme="priestconnect"
    >
      <AppNavigator />
    </StripeProvider>
  );
}
```

## Implementation Guidelines

### Component Architecture
- **Atomic Design**: Build from atoms → molecules → organisms → templates
- **Props Interface**: Define TypeScript interfaces for all props
- **Error Boundaries**: Wrap screens in error handling
- **Accessibility**: Include accessibility props and ARIA labels
- **Performance**: Use React.memo, useMemo, useCallback appropriately

### State Management Patterns
```typescript
// Context + Reducer pattern for complex state
const BookingContext = createContext<{
  state: BookingState;
  dispatch: Dispatch<BookingAction>;
}>();

// Custom hooks for state logic
const useBookingFlow = () => {
  const context = useContext(BookingContext);
  return useMemo(() => ({
    // Derived state and actions
  }), [context]);
};
```

### API Integration Patterns
```typescript
// Service layer with error handling
const ApiService = {
  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    try {
      // Implementation with proper error handling
    } catch (error) {
      // Standardized error handling
      throw new AppError('BOOKING_CREATION_FAILED', error.message);
    }
  }
};

// React Query pattern for data fetching
const useBookings = (userId: string) => {
  return useQuery({
    queryKey: ['bookings', userId],
    queryFn: () => ApiService.getUserBookings(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### UI/UX Implementation Standards
- **Loading States**: Skeleton screens, spinner overlays, progressive loading
- **Error States**: User-friendly error messages with recovery actions
- **Empty States**: Helpful illustrations and call-to-action buttons
- **Feedback**: Toast messages, haptic feedback, visual confirmations
- **Transitions**: Smooth page transitions, micro-animations
- **Responsive**: Consistent experience across device sizes

### Security & Performance
- **Input Validation**: Client-side + server-side validation
- **API Security**: Authenticated requests, rate limiting
- **Data Privacy**: Minimal data collection, secure storage
- **Performance**: Code splitting, lazy loading, image optimization
- **Offline Support**: Basic offline functionality with queue sync

## Deliverable Expectations

When implementing this app, provide:

1. **Complete file structure** with all components
2. **TypeScript interfaces** for all data models
3. **Firebase configuration** and Firestore rules
4. **Stripe integration** with Connect setup
5. **Modern UI components** with accessibility
6. **State management** with Context/Reducer
7. **Navigation setup** with proper typing
8. **Error handling** and loading states
9. **Form validation** and user feedback
10. **Mobile-optimized** interactions and gestures

Each file should be production-ready, well-documented, and follow modern React Native best practices. The app should feel native on both iOS and Android while maintaining web compatibility.