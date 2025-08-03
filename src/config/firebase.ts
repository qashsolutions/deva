import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  PRIESTS: 'priests',
  SERVICES: 'services',
  BOOKINGS: 'bookings',
  AVAILABILITY: 'availability',
  REVIEWS: 'reviews',
  PAYMENTS: 'payments',
  CONNECT_ACCOUNTS: 'connectAccounts',
  LOYALTY_CREDITS: 'loyaltyCredits',
  NOTIFICATIONS: 'notifications',
  TEMPLES: 'temples',
  MESSAGES: 'messages',
  QUOTES: 'quotes',
} as const;

// Storage paths
export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profile-images',
  SERVICE_IMAGES: 'service-images',
  TEMPLE_IMAGES: 'temple-images',
  DOCUMENTS: 'documents',
} as const;

// Function names
export const FUNCTIONS = {
  CREATE_PAYMENT_INTENT: 'createPaymentIntent',
  CONFIRM_PAYMENT: 'confirmPayment',
  PROCESS_REFUND: 'processRefund',
  CREATE_CONNECT_ACCOUNT: 'createConnectAccount',
  CREATE_ONBOARDING_LINK: 'createOnboardingLink',
  RELEASE_ESCROW_FUNDS: 'releaseEscrowFunds',
  SEND_NOTIFICATION: 'sendNotification',
  CALCULATE_DISTANCE: 'calculateDistance',
  GENERATE_QUOTE: 'generateQuote',
  VERIFY_PHONE: 'verifyPhone',
} as const;

// Firebase configuration constants
export const FIREBASE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  PHONE_AUTH_TIMEOUT: 60, // seconds
  OTP_LENGTH: 6,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
} as const;

export default app;