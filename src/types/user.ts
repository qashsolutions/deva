export type UserType = 'priest' | 'devotee';
export type PriestType = 'temple_employee' | 'temple_owner' | 'independent';

export interface Location {
  zipCode: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isDefault?: boolean;
}

export interface User {
  id: string;
  phone: string;
  userType: UserType;
  name: string;
  email?: string;
  profileImage?: string;
  location: Location;
  
  // Priest-specific fields
  priestType?: PriestType;
  templeId?: string;
  templeName?: string;
  templeSharePercentage?: number;
  languages?: string[];
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  bio?: string;
  yearsOfExperience?: number;
  certifications?: string[];
  
  // Devotee-specific fields
  preferredLanguages?: string[];
  savedAddresses?: SavedAddress[];
  favoritesPriestIds?: string[];
  
  // Stripe Connect
  stripeConnectAccountId?: string;
  stripeCustomerId?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
  
  // Settings
  notificationSettings?: {
    bookingUpdates: boolean;
    messages: boolean;
    promotions: boolean;
    reminders: boolean;
  };
  
  // Status
  isVerified: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
  
  // Premium/Promotion fields
  isPremium?: boolean;
  premiumStartDate?: Date;
  premiumEndDate?: Date;
  premiumZipCodes?: string[]; // ZIP codes where priest is promoted
  premiumFeeAmount?: number; // Amount paid for premium placement
  premiumTier?: 'silver' | 'gold' | 'platinum'; // Higher tier = higher priority
}

export interface Temple {
  id: string;
  name: string;
  address: string;
  location: {
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  phone: string;
  email?: string;
  website?: string;
  images?: string[];
  description?: string;
  
  // Temple owner info
  ownerId: string;
  ownerName: string;
  
  // Priest management
  priestIds: string[];
  defaultSharePercentage: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface PriestProfile extends User {
  userType: 'priest';
  priestType: PriestType;
  
  // Additional priest-specific data
  servicesOffered: string[]; // Service IDs
  availability: {
    regularHours?: {
      [key: string]: { // day of week
        isAvailable: boolean;
        slots?: Array<{
          startTime: string;
          endTime: string;
        }>;
      };
    };
    blackoutDates?: string[]; // ISO date strings
  };
  
  // Pricing preferences
  pricingPreferences: {
    acceptsNegotiation: boolean;
    minimumBookingAmount?: number;
    travelFeePerMile?: number;
    maxTravelDistance: number;
  };
  
  // Performance metrics
  metrics: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    responseTime: number; // average in hours
    acceptanceRate: number; // percentage
  };
}

export interface DevoteeProfile extends User {
  userType: 'devotee';
  
  // Booking preferences
  bookingPreferences: {
    preferredServiceTypes?: string[];
    preferredTimeSlots?: string[];
    budgetRange?: {
      min: number;
      max: number;
    };
  };
  
  // Loyalty data
  loyaltyData: {
    totalBookings: number;
    totalSpent: number;
    credits: number;
    creditHistory: Array<{
      priestId: string;
      amount: number;
      earnedDate: Date;
      expiryDate?: Date;
    }>;
  };
}