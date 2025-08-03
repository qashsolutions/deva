##Files and flows completed##
Priest and Devotee User Flows

  Devotee Flow

  1. Authentication & Onboarding
    - WelcomeScreen → PhoneAuthScreen → OTPScreen
    - UserTypeScreen (select "Devotee")
    - ProfileSetupScreen (basic profile info)
  2. Main Journey
    - DashboardScreen - View upcoming bookings, recent priests
    - SearchScreen or SmartSearchScreen - Find priests by location/service
    - PriestDetailScreen - View priest profile, services, reviews
    - BookingFlowScreen - Select service, date, time, special requests
    - PaymentScreen - Pay advance amount (25-100%)
    - BookingHistoryScreen - Track all bookings
    - BookingDetailScreen - View specific booking details
    - After service: WriteReviewScreen - Rate and review priest
  3. AI-Enhanced Features
    - CulturalGuideScreen - Learn about ceremonies
    - CeremonyPlannerScreen - Plan ceremonies with AI guidance

  Priest Flow

  1. Authentication & Onboarding
    - WelcomeScreen → PhoneAuthScreen → OTPScreen
    - UserTypeScreen (select "Priest")
    - PriestTypeScreen (Temple Employee/Owner/Independent)
    - ProfileSetupScreen (languages, specializations, temple info)
    - ConnectSetupScreen - Stripe Connect onboarding for payments
  2. Main Journey
    - DashboardScreen - View bookings, earnings summary
    - ServiceManagementScreen - Create/edit services dynamically
    - AvailabilityScreen - Set calendar availability
    - BookingManagementScreen - Accept/decline bookings
    - EarningsScreen - View detailed earnings, payouts
    - ProfileScreen - Manage profile, settings
  3. AI-Enhanced Features
    - PricingInsightsScreen - AI-powered pricing optimization
    - QuoteGenerator component - AI helps generate quotes

  Data Storage Architecture

  Firebase Firestore (Cloud Database)

  All core data is stored in Firebase Firestore, NOT local SQLite. Here's the database structure:

  // Firestore Collections Structure

  // Users Collection
  users/
  ├── {userId}/
      ├── profile data (name, phone, email, userType)
      ├── location data
      ├── priest-specific data (if priest)
      └── devotee preferences (if devotee)

  // Services Collection
  services/
  ├── {serviceId}/
      ├── priestId
      ├── service details
      ├── pricing info
      └── cancellation policy

  // Bookings Collection
  bookings/
  ├── {bookingId}/
      ├── devoteeId
      ├── priestId
      ├── service details
      ├── scheduling info
      ├── payment data
      └── status

  // Reviews Collection
  reviews/
  ├── {reviewId}/
      ├── bookingId
      ├── priestId
      ├── devoteeId
      ├── rating
      └── comment

  // Availability Collection
  availability/
  ├── {priestId}/
      └── {date}/
          └── timeSlots[]

  // Payments Collection (sensitive data)
  payments/
  ├── {paymentId}/
      ├── bookingId
      ├── stripePaymentIntentId
      ├── amounts
      └── status

  Data Storage Implementation

  Looking at src/services/firestore.ts, the app uses Firebase Firestore for all data operations:

  // Example from firestore.ts
  export const createUser = async (userId: string, userData: Partial<User>) => {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  export const getBookings = async (userId: string, userType: 'priest' | 'devotee') => {
    const field = userType === 'priest' ? 'priestId' : 'devoteeId';
    const q = query(
      collection(db, 'bookings'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );
    // ... returns booking data
  };

  Local Storage Usage

  The app uses minimal local storage:

  1. AsyncStorage (React Native) for:
    - Authentication tokens
    - User preferences
    - Cached user profile
    - AI response cache (to reduce API costs)
  2. Context State for runtime data:
    - Current user session
    - Active booking flow
    - UI state

  Data Sync Strategy

  1. Real-time Updates: Firestore listeners for bookings, messages
  2. Offline Support: Firestore's built-in offline persistence
  3. Optimistic Updates: Update UI immediately, sync to Firebase
  4. Background Sync: Push notifications trigger data refresh

  Security Rules

  Firebase Firestore security rules ensure:
  - Users can only read/write their own data
  - Priests can only modify their own services
  - Bookings are accessible to both parties
  - Payment data has restricted access

  No database creation needed - Firebase Firestore is automatically provisioned when you set up the Firebase project. The collections are created automatically when data is first written to them.