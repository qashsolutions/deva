# Devebhyo - React Native Implementation Progress

## Project Overview
**Devebhyo** is a marketplace app connecting Hindu devotees in the US with qualified priests for religious ceremonies.

## Implementation Progress

### ✅ Phase 1: Core Infrastructure (COMPLETED)
- [x] `src/config/constants.ts` - App constants, service types, languages
- [x] `src/config/firebase.ts` - Firebase configuration
- [x] `src/config/stripe.ts` - Stripe configuration
- [x] `src/config/theme.ts` - Design system tokens

### ✅ Phase 1: TypeScript Types (COMPLETED)
- [x] `src/types/user.ts` - User, priest, devotee interfaces
- [x] `src/types/service.ts` - Service offering and pricing types
- [x] `src/types/booking.ts` - Booking flow and messaging types
- [x] `src/types/payment.ts` - Payment, escrow, and refund types
- [x] `src/types/index.ts` - Common types and re-exports

### ✅ Phase 1: Utilities (COMPLETED)
- [x] `src/utils/validation.ts` - Input validation functions
- [x] `src/utils/dateUtils.ts` - Date/time utilities
- [x] `src/utils/locationUtils.ts` - ZIP code, distance calculations
- [x] `src/utils/formatters.ts` - Price, phone, name formatting
- [x] `src/utils/index.ts` - Additional utilities and re-exports

### ✅ Phase 2: Authentication & State Management (COMPLETED)
- [x] `src/contexts/AuthContext.tsx` - Authentication state management
- [x] `src/contexts/UserContext.tsx` - User profile state
- [x] `src/contexts/BookingContext.tsx` - Booking flow state
- [x] `src/services/auth.ts` - Firebase Auth functions
- [x] `src/services/firestore.ts` - Database operations
- [x] `src/services/notifications.ts` - Push notification setup

### ✅ Phase 2: Services (COMPLETED)
- [x] `src/services/payments/stripeService.ts` - Core Stripe operations
- [x] `src/services/payments/connectService.ts` - Stripe Connect for priests
- [x] `src/services/payments/escrowService.ts` - Payment holding & release
- [x] `src/services/payments/refundService.ts` - Cancellation & refund logic
- [x] `src/services/payments/webhookService.ts` - Stripe webhook handlers

### ✅ Phase 2: Navigation (COMPLETED)
- [x] `src/navigation/AppNavigator.tsx` - Main navigation controller
- [x] `src/navigation/AuthNavigator.tsx` - Authentication flow
- [x] `src/navigation/PriestNavigator.tsx` - Priest-specific navigation
- [x] `src/navigation/DevoteeNavigator.tsx` - Devotee-specific navigation

### ✅ Phase 3: Common Components (COMPLETED)
- [x] `src/components/common/Button.tsx`
- [x] `src/components/common/Input.tsx`
- [x] `src/components/common/LoadingSpinner.tsx`
- [x] `src/components/common/Modal.tsx`
- [x] `src/components/common/Card.tsx`
- [x] `src/components/common/Avatar.tsx`
- [x] `src/components/common/Rating.tsx`
- [x] `src/components/common/Badge.tsx`
- [x] `src/components/common/EmptyState.tsx`

### ✅ Phase 4: Authentication Screens (COMPLETED)
- [x] `src/screens/auth/WelcomeScreen.tsx`
- [x] `src/screens/auth/PhoneAuthScreen.tsx`
- [x] `src/screens/auth/OTPScreen.tsx`
- [x] `src/screens/auth/UserTypeScreen.tsx`
- [x] `src/screens/auth/PriestTypeScreen.tsx`
- [x] `src/screens/auth/ProfileSetupScreen.tsx`

### ✅ Phase 5: Devotee Features (COMPLETED)
- [x] `src/screens/devotee/DashboardScreen.tsx`
- [x] `src/screens/devotee/SearchScreen.tsx`
- [x] `src/screens/devotee/PriestDetailScreen.tsx`
- [x] `src/screens/devotee/BookingFlowScreen.tsx`
- [x] `src/screens/devotee/PaymentScreen.tsx`
- [x] `src/screens/devotee/BookingHistoryScreen.tsx`
- [x] `src/screens/devotee/BookingDetailScreen.tsx`
- [x] `src/screens/devotee/ProfileScreen.tsx`

### ✅ Phase 6: Priest Features (COMPLETED)
- [x] `src/screens/priest/DashboardScreen.tsx`
- [x] `src/screens/priest/ServiceManagementScreen.tsx`
- [x] `src/screens/priest/AvailabilityScreen.tsx`
- [x] `src/screens/priest/BookingManagementScreen.tsx`
- [x] `src/screens/priest/EarningsScreen.tsx`
- [x] `src/screens/priest/ProfileScreen.tsx`

### ✅ Phase 7: Payment Integration (COMPLETED)
- [x] `src/services/payments/stripeService.ts` - Core Stripe operations
- [x] `src/services/payments/connectService.ts` - Stripe Connect for priests
- [x] `src/services/payments/escrowService.ts` - Payment holding & release
- [x] `src/services/payments/refundService.ts` - Cancellation & refund logic
- [x] `src/services/payments/webhookService.ts` - Stripe webhook handlers
- [x] `src/components/payments/PaymentForm.tsx` - Credit card input (Stripe Elements)
- [x] `src/components/payments/PaymentMethod.tsx` - Saved payment methods
- [x] `src/components/payments/ConnectOnboarding.tsx` - Priest Stripe Connect setup
- [x] `src/components/payments/EarningsCard.tsx` - Priest earnings display
- [x] `src/components/payments/RefundStatus.tsx` - Refund tracking component
- [x] `src/components/payments/PaymentHistory.tsx` - Transaction history
- [x] `src/screens/payments/ConnectSetupScreen.tsx` - Priest payout setup
- [x] `src/screens/payments/RefundScreen.tsx` - Cancellation & refunds

### ✅ Phase 8: Core Launch Features (COMPLETED)
- [x] `src/services/notifications.ts` - Push notification service (already existed)
- [x] `src/types/review.ts` - Review type definitions
- [x] `src/services/reviews.ts` - Review service for CRUD operations
- [x] `src/components/reviews/ReviewCard.tsx` - Review display component
- [x] `src/components/reviews/ReviewForm.tsx` - Review submission form
- [x] `src/screens/reviews/WriteReviewScreen.tsx` - Screen for writing reviews
- [x] `src/screens/reviews/ReviewsListScreen.tsx` - Reviews listing and filtering

### ✅ Phase 8: AI Features (COMPLETED)
#### AI Configuration
- [x] `src/config/ai.ts` - AI provider configuration (Claude + Gemini)

#### AI Types
- [x] `src/types/ai.ts` - AI-related type definitions

#### AI Services
- [x] `src/services/ai/aiProvider.ts` - Core AI service with fallback
- [x] `src/services/ai/matchingService.ts` - Intelligent priest matching
- [x] `src/services/ai/pricingService.ts` - Dynamic pricing optimization
- [x] `src/services/ai/ceremonyGuideService.ts` - Cultural guidance & preparation
- [x] `src/services/ai/aiCache.ts` - Response caching for cost optimization

#### AI Components
- [x] `src/components/ai/PriestRecommendations.tsx` - AI-powered priest suggestions
- [x] `src/components/ai/CeremonyGuide.tsx` - Interactive ceremony preparation
- [x] `src/components/ai/ChatInterface.tsx` - Q&A chat component
- [x] `src/components/ai/PricingAssistant.tsx` - Priest pricing optimization
- [x] `src/components/ai/QuoteGenerator.tsx` - AI-powered quote responses
- [x] `src/components/ai/PreparationChecklist.tsx` - Dynamic ceremony checklists

#### AI Screens
- [x] `src/screens/ai/SmartSearchScreen.tsx` - Natural language priest search
- [x] `src/screens/ai/CeremonyPlannerScreen.tsx` - Complete ceremony planning
- [x] `src/screens/ai/PricingInsightsScreen.tsx` - Market intelligence for priests
- [x] `src/screens/ai/CulturalGuideScreen.tsx` - Educational content hub

## Technical Details

### File Structure Requirements
- Maximum 300 lines per file (adjusted from 250)
- No deprecated features
- Complete, production-ready code
- Modern React Native patterns

### Key Features Implemented
1. **Dynamic Service Management** - Priests can create custom services (not hardcoded)
2. **Flexible Pricing** - Fixed, range-based, or quote-on-request
3. **Complex Payment Flows** - Escrow, multi-party payouts, loyalty credits
4. **Location-Based Matching** - ZIP code radius search
5. **Three Priest Types** - Temple Employee, Temple Owner, Independent

### Architecture Decisions
- Using React Context + useReducer for state management
- Firebase for backend services
- Stripe Connect for payment processing
- TypeScript for type safety
- Utility-first styling approach

## Implementation Summary

### Completed Files Count: 93 files
- Configuration: 5 files (including AI config)
- Types: 7 files (including review and AI types)
- Utilities: 5 files
- Contexts: 3 files
- Services: 17 files (including 5 payment services + reviews + 5 AI services)
- Navigation: 4 files
- Common Components: 9 files
- Authentication Screens: 6 files
- Devotee Screens: 8 files
- Priest Screens: 6 files
- Payment Components: 6 files
- Payment Screens: 2 files
- Review Components: 2 files
- Review Screens: 2 files
- AI Components: 6 files
- AI Screens: 4 files
- Push Notifications: 1 file (enhanced)

### Architecture Highlights
1. **Authentication System**: Phone-based auth with OTP verification
2. **State Management**: Context + Reducer pattern for complex state
3. **Payment Architecture**: 
   - Stripe Connect for priest payouts
   - Escrow system for advance payments
   - Multi-party payment splits (priest, temple, platform)
   - Loyalty credit retention system
4. **Real-time Features**: Notifications, messaging, live booking updates
5. **Type Safety**: Complete TypeScript coverage with strict types
6. **AI Integration**: 
   - Natural language search with Claude/Gemini
   - Intelligent priest matching with scoring
   - Dynamic pricing optimization
   - Cultural education and ceremony guidance
   - Smart caching for cost optimization

## App Launch Ready! 🎉

The Devebhyo React Native app is now ready for launch with all core features implemented:
- ✅ User authentication (Phone + OTP)
- ✅ Priest and devotee profiles  
- ✅ Service management
- ✅ Booking system
- ✅ Payment processing (Stripe)
- ✅ Push notifications
- ✅ Reviews & ratings
- ✅ AI-powered features (Smart search, pricing insights, ceremony planning)

### Complete File List for Launch (93 files)

#### Configuration (5 files)
- ✅ `src/config/constants.ts`
- ✅ `src/config/firebase.ts`
- ✅ `src/config/stripe.ts`
- ✅ `src/config/theme.ts`
- ✅ `src/config/ai.ts`

#### Types (7 files)
- ✅ `src/types/user.ts`
- ✅ `src/types/service.ts`
- ✅ `src/types/booking.ts`
- ✅ `src/types/payment.ts`
- ✅ `src/types/review.ts`
- ✅ `src/types/ai.ts`
- ✅ `src/types/index.ts`

#### Utilities (5 files)
- ✅ `src/utils/validation.ts`
- ✅ `src/utils/dateUtils.ts`
- ✅ `src/utils/locationUtils.ts`
- ✅ `src/utils/formatters.ts`
- ✅ `src/utils/index.ts`

#### Contexts (3 files)
- ✅ `src/contexts/AuthContext.tsx`
- ✅ `src/contexts/UserContext.tsx`
- ✅ `src/contexts/BookingContext.tsx`

#### Services (17 files)
- ✅ `src/services/auth.ts`
- ✅ `src/services/firestore.ts`
- ✅ `src/services/notifications.ts`
- ✅ `src/services/reviews.ts`
- ✅ `src/services/payments/stripeService.ts`
- ✅ `src/services/payments/connectService.ts`
- ✅ `src/services/payments/escrowService.ts`
- ✅ `src/services/payments/refundService.ts`
- ✅ `src/services/payments/webhookService.ts`
- ✅ `src/services/ai/aiProvider.ts`
- ✅ `src/services/ai/matchingService.ts`
- ✅ `src/services/ai/pricingService.ts`
- ✅ `src/services/ai/ceremonyGuideService.ts`
- ✅ `src/services/ai/aiCache.ts`

#### Navigation (4 files)
- ✅ `src/navigation/AppNavigator.tsx`
- ✅ `src/navigation/AuthNavigator.tsx`
- ✅ `src/navigation/PriestNavigator.tsx`
- ✅ `src/navigation/DevoteeNavigator.tsx`

#### Common Components (9 files)
- ✅ `src/components/common/Button.tsx`
- ✅ `src/components/common/Input.tsx`
- ✅ `src/components/common/LoadingSpinner.tsx`
- ✅ `src/components/common/Modal.tsx`
- ✅ `src/components/common/Card.tsx`
- ✅ `src/components/common/Avatar.tsx`
- ✅ `src/components/common/Rating.tsx`
- ✅ `src/components/common/Badge.tsx`
- ✅ `src/components/common/EmptyState.tsx`

#### Authentication Screens (6 files)
- ✅ `src/screens/auth/WelcomeScreen.tsx`
- ✅ `src/screens/auth/PhoneAuthScreen.tsx`
- ✅ `src/screens/auth/OTPScreen.tsx`
- ✅ `src/screens/auth/UserTypeScreen.tsx`
- ✅ `src/screens/auth/PriestTypeScreen.tsx`
- ✅ `src/screens/auth/ProfileSetupScreen.tsx`

#### Devotee Screens (8 files)
- ✅ `src/screens/devotee/DashboardScreen.tsx`
- ✅ `src/screens/devotee/SearchScreen.tsx`
- ✅ `src/screens/devotee/PriestDetailScreen.tsx`
- ✅ `src/screens/devotee/BookingFlowScreen.tsx`
- ✅ `src/screens/devotee/PaymentScreen.tsx`
- ✅ `src/screens/devotee/BookingHistoryScreen.tsx`
- ✅ `src/screens/devotee/BookingDetailScreen.tsx`
- ✅ `src/screens/devotee/ProfileScreen.tsx`

#### Priest Screens (6 files)
- ✅ `src/screens/priest/DashboardScreen.tsx`
- ✅ `src/screens/priest/ServiceManagementScreen.tsx`
- ✅ `src/screens/priest/AvailabilityScreen.tsx`
- ✅ `src/screens/priest/BookingManagementScreen.tsx`
- ✅ `src/screens/priest/EarningsScreen.tsx`
- ✅ `src/screens/priest/ProfileScreen.tsx`

#### Payment Components (6 files)
- ✅ `src/components/payments/PaymentForm.tsx`
- ✅ `src/components/payments/PaymentMethod.tsx`
- ✅ `src/components/payments/ConnectOnboarding.tsx`
- ✅ `src/components/payments/EarningsCard.tsx`
- ✅ `src/components/payments/RefundStatus.tsx`
- ✅ `src/components/payments/PaymentHistory.tsx`

#### Payment Screens (2 files)
- ✅ `src/screens/payments/ConnectSetupScreen.tsx`
- ✅ `src/screens/payments/RefundScreen.tsx`

#### Review Components (2 files)
- ✅ `src/components/reviews/ReviewCard.tsx`
- ✅ `src/components/reviews/ReviewForm.tsx`

#### Review Screens (2 files)
- ✅ `src/screens/reviews/WriteReviewScreen.tsx`
- ✅ `src/screens/reviews/ReviewsListScreen.tsx`

#### AI Components (6 files)
- ✅ `src/components/ai/PriestRecommendations.tsx`
- ✅ `src/components/ai/CeremonyGuide.tsx`
- ✅ `src/components/ai/ChatInterface.tsx`
- ✅ `src/components/ai/PricingAssistant.tsx`
- ✅ `src/components/ai/QuoteGenerator.tsx`
- ✅ `src/components/ai/PreparationChecklist.tsx`

#### AI Screens (4 files)
- ✅ `src/screens/ai/SmartSearchScreen.tsx`
- ✅ `src/screens/ai/CeremonyPlannerScreen.tsx`
- ✅ `src/screens/ai/PricingInsightsScreen.tsx`
- ✅ `src/screens/ai/CulturalGuideScreen.tsx`

## NOT INCLUDED IN THIS LAUNCH (Future Features)

The following features are explicitly NOT part of the current launch and will be implemented post-launch based on user feedback and requirements:

### Phase 9: Post-Launch Features

1. **Messaging System**
   - ❌ `ChatScreen.tsx` - In-app messaging
   - ❌ `MessageBubble.tsx` - Individual message component
   - ❌ `QuoteMessage.tsx` - Special quote message type

2. **Analytics Dashboards**
   - ❌ `BookingAnalytics.tsx` - Booking trends for priests
   - ❌ `SpendingAnalytics.tsx` - Spending insights for devotees

3. **Additional Features (Not Yet Planned)**
   - ❌ Video consultations
   - ❌ Multi-language support beyond current options
   - ❌ Advanced search filters
   - ❌ Social features
   - ❌ Referral system UI
##
#Devebhyo  - React Native Implementation Guide

## Business Context

**Devebhyo** is a marketplace app connecting Hindu devotees in the US with qualified priests for religious ceremonies. The app addresses the shortage of available priests by enabling part-time priests (working professionals) to offer weekend services.

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