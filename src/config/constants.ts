export const APP_NAME = 'Devebhyo';
export const APP_VERSION = '1.0.0';

// Note: These are example service types. In production, services will be
// dynamically managed by priests through the app
export const SERVICE_TYPES = {
  GRIHA_PRAVESH: {
    id: 'griha_pravesh',
    name: 'Griha Pravesh (House Warming)',
    defaultDuration: 120, // minutes
    icon: '🏠',
  },
  SATYANARAYAN_PUJA: {
    id: 'satyanarayan_puja',
    name: 'Satyanarayan Puja',
    defaultDuration: 90,
    icon: '🕉️',
  },
  WEDDING_CEREMONY: {
    id: 'wedding_ceremony',
    name: 'Wedding Ceremony',
    defaultDuration: 240,
    icon: '💒',
  },
  GANESH_PUJA: {
    id: 'ganesh_puja',
    name: 'Ganesh Puja',
    defaultDuration: 60,
    icon: '🐘',
  },
  LAKSHMI_PUJA: {
    id: 'lakshmi_puja',
    name: 'Lakshmi Puja',
    defaultDuration: 90,
    icon: '💐',
  },
  NAVAGRAHA_PUJA: {
    id: 'navagraha_puja',
    name: 'Navagraha Puja',
    defaultDuration: 120,
    icon: '🌟',
  },
  MUNDAN_CEREMONY: {
    id: 'mundan_ceremony',
    name: 'Mundan (First Haircut)',
    defaultDuration: 60,
    icon: '👶',
  },
  NAMKARAN_CEREMONY: {
    id: 'namkaran_ceremony',
    name: 'Namkaran (Naming Ceremony)',
    defaultDuration: 90,
    icon: '📿',
  },
  ANNAPRASHAN: {
    id: 'annaprashan',
    name: 'Annaprashan (First Feeding)',
    defaultDuration: 60,
    icon: '🍚',
  },
  CUSTOM_CEREMONY: {
    id: 'custom_ceremony',
    name: 'Custom Ceremony',
    defaultDuration: 120,
    icon: '🙏',
  },
} as const;

export const LANGUAGES = [
  { id: 'hindi', name: 'Hindi', code: 'hi' },
  { id: 'english', name: 'English', code: 'en' },
  { id: 'sanskrit', name: 'Sanskrit', code: 'sa' },
  { id: 'tamil', name: 'Tamil', code: 'ta' },
  { id: 'telugu', name: 'Telugu', code: 'te' },
  { id: 'gujarati', name: 'Gujarati', code: 'gu' },
  { id: 'marathi', name: 'Marathi', code: 'mr' },
  { id: 'bengali', name: 'Bengali', code: 'bn' },
  { id: 'kannada', name: 'Kannada', code: 'kn' },
  { id: 'malayalam', name: 'Malayalam', code: 'ml' },
  { id: 'punjabi', name: 'Punjabi', code: 'pa' },
] as const;

export const PRIEST_TYPES = {
  TEMPLE_EMPLOYEE: {
    id: 'temple_employee',
    name: 'Temple Employee',
    description: 'I work for a temple and share earnings',
    icon: '🏛️',
  },
  TEMPLE_OWNER: {
    id: 'temple_owner',
    name: 'Temple Owner',
    description: 'I own/manage a temple',
    icon: '🏛️👑',
  },
  INDEPENDENT: {
    id: 'independent',
    name: 'Independent Priest',
    description: 'I work independently (part-time/full-time)',
    icon: '🏠',
  },
} as const;

export const BOOKING_STATUS = {
  QUOTE_REQUESTED: 'quote_requested',
  QUOTE_PROVIDED: 'quote_provided',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  REQUIRES_PAYMENT: 'requires_payment',
  PROCESSING: 'processing',
  HELD_IN_ESCROW: 'held_in_escrow',
  PARTIALLY_RELEASED: 'partially_released',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
} as const;

export const PRICING_TYPES = {
  FIXED: 'fixed',
  RANGE: 'range',
  QUOTE_REQUEST: 'quote_request',
} as const;

export const ADVANCE_PAYMENT_OPTIONS = [
  { value: 25, label: '25% advance, 75% on completion' },
  { value: 50, label: '50% advance, 50% on completion' },
  { value: 75, label: '75% advance, 25% on completion' },
  { value: 100, label: '100% advance payment' },
] as const;

export const DEFAULT_SEARCH_RADIUS = 25; // miles
export const MAX_PRIEST_SELECTION = 2;
export const CALENDAR_MODIFICATION_DAYS = 3; // Can't modify within 3 days
export const DEFAULT_RETENTION_AMOUNT = 25; // $25 for loyalty
export const PLATFORM_FEE_PERCENTAGE = 5; // 5% platform fee

export const EMERGENCY_EXCEPTIONS = [
  'weather_emergency',
  'medical_emergency',
  'family_emergency',
  'natural_disaster',
] as const;

export const TIME_SLOTS = [
  { start: '06:00', end: '08:00', label: '6:00 AM - 8:00 AM' },
  { start: '08:00', end: '10:00', label: '8:00 AM - 10:00 AM' },
  { start: '10:00', end: '12:00', label: '10:00 AM - 12:00 PM' },
  { start: '12:00', end: '14:00', label: '12:00 PM - 2:00 PM' },
  { start: '14:00', end: '16:00', label: '2:00 PM - 4:00 PM' },
  { start: '16:00', end: '18:00', label: '4:00 PM - 6:00 PM' },
  { start: '18:00', end: '20:00', label: '6:00 PM - 8:00 PM' },
] as const;

export const REGEX_PATTERNS = {
  PHONE: /^\+?1?\d{10}$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
} as const;

export const ERROR_MESSAGES = {
  PHONE_INVALID: 'Please enter a valid 10-digit phone number',
  ZIP_CODE_INVALID: 'Please enter a valid ZIP code',
  EMAIL_INVALID: 'Please enter a valid email address',
  NAME_INVALID: 'Please enter a valid name (2-50 characters)',
  LOCATION_REQUIRED: 'Location is required to find priests near you',
  SERVICE_REQUIRED: 'Please select at least one service',
  DATE_INVALID: 'Please select a valid future date',
  TIME_SLOT_UNAVAILABLE: 'This time slot is no longer available',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  SERVICE_ADDED: 'Service added successfully',
  BOOKING_CONFIRMED: 'Booking confirmed successfully',
  PAYMENT_SUCCESSFUL: 'Payment processed successfully',
  QUOTE_SENT: 'Quote request sent successfully',
  REVIEW_SUBMITTED: 'Review submitted successfully',
} as const;