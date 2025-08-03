export type PricingType = 'fixed' | 'range' | 'quote_request';

export interface PriceRange {
  min: number;
  max: number;
}

export interface BulkDiscount {
  bookings: number;
  discountPercentage: number;
}

export interface CancellationTier {
  hoursBeforeService: number;
  feePercentage: number;
}

export interface ServicePricing {
  type: PricingType;
  fixedPrice?: number;
  priceRange?: PriceRange;
  seasonalPricing?: boolean;
  seasonalMultiplier?: number;
  bulkDiscounts?: BulkDiscount[];
}

export interface PaymentTerms {
  advancePercentage: number; // 25, 50, 75, or 100
  retentionAmount: number; // Amount kept for customer loyalty
  acceptsPartialPayment: boolean;
  paymentMethods?: string[]; // ['card', 'cash', 'check']
}

export interface CancellationPolicy {
  freeUntilHours: number;
  tieredFees: CancellationTier[];
  noRefundHours: number;
  emergencyExceptions: string[];
  customTerms?: string;
}

export interface ServiceOffering {
  id: string;
  priestId: string;
  serviceType: string;
  serviceName: string;
  description: string;
  duration: number; // in minutes
  
  pricing: ServicePricing;
  paymentTerms: PaymentTerms;
  cancellationPolicy: CancellationPolicy;
  
  // Service details
  includesMaterials: boolean;
  materialsIncluded?: string[];
  additionalMaterialsCost?: number;
  
  travelIncluded: boolean;
  maxTravelDistance: number; // in miles
  travelFeePerMile?: number;
  
  // Requirements
  requirements?: {
    minimumAttendees?: number;
    maximumAttendees?: number;
    venueRequirements?: string[];
    specialInstructions?: string;
  };
  
  // Availability
  isActive: boolean;
  isAvailableWeekends: boolean;
  isAvailableWeekdays: boolean;
  advanceBookingDays: number; // Minimum days in advance
  
  // Images
  images?: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Performance
  bookingCount: number;
  averageRating?: number;
  completionRate?: number;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultDuration: number;
  icon: string;
  suggestedPriceRange?: PriceRange;
  commonMaterials?: string[];
  keywords?: string[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  serviceTemplates: ServiceTemplate[];
}

export interface ServiceRequest {
  serviceType: string;
  serviceName?: string;
  description?: string;
  duration?: number;
  pricingType: PricingType;
  price?: number;
  priceRange?: PriceRange;
  requirements?: string;
}