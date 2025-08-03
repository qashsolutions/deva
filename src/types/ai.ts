import { Priest, ServiceOffering } from './user';
import { Location } from './index';

// AI Query Types
export interface AIQueryOptions {
  skipCache?: boolean;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeout?: number;
}

export interface AIResponse {
  content: string;
  provider: 'anthropic' | 'gemini';
  model: string;
  tokensUsed: number;
  cached: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Priest Matching Types
export interface PriestRecommendation {
  priest: Priest;
  matchScore: number; // 0-100
  reasoning: string;
  strengths: string[];
  considerations: string[];
  estimatedPrice?: number;
  travelDistance?: number;
  availability: {
    nextAvailable: string;
    hasRequestedSlot: boolean;
  };
}

export interface MatchingCriteria {
  query: string;
  serviceType?: string;
  location: Location;
  dateRange?: {
    start: Date;
    end: Date;
  };
  budget?: {
    min: number;
    max: number;
  };
  languages?: string[];
  priestType?: 'temple_employee' | 'temple_owner' | 'independent';
  specialRequirements?: string[];
}

// Ceremony Guide Types
export interface CeremonyGuide {
  id: string;
  ceremonyType: string;
  title: string;
  description: string;
  duration: string;
  significance: string;
  preparations: CeremonyPreparation[];
  items: RequiredItem[];
  dosDonts: {
    dos: string[];
    donts: string[];
  };
  faqs: FAQ[];
  culturalNotes: string[];
  generatedAt: string;
}

export interface CeremonyPreparation {
  category: 'spiritual' | 'physical' | 'material' | 'dietary';
  title: string;
  description: string;
  timeline: string; // e.g., "1 week before", "Day of ceremony"
  required: boolean;
}

export interface RequiredItem {
  name: string;
  quantity: number | string;
  description: string;
  alternatives?: string[];
  whereToGet?: string;
  estimatedCost?: string;
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
}

// Pricing Intelligence Types
export interface PricingInsight {
  serviceId: string;
  serviceName: string;
  marketAnalysis: {
    averagePrice: number;
    priceRange: {
      min: number;
      max: number;
      median: number;
    };
    demandLevel: 'low' | 'moderate' | 'high';
    competitorCount: number;
  };
  recommendations: {
    suggestedPrice: number;
    reasoning: string;
    pricingStrategy: 'competitive' | 'premium' | 'value';
    adjustmentFactors: string[];
  };
  trends: {
    direction: 'increasing' | 'stable' | 'decreasing';
    seasonalFactors: string[];
    peakDates: string[];
  };
}

export interface PricingQuery {
  serviceType: string;
  location: Location;
  priestExperience: number; // years
  includeTravel?: boolean;
  duration?: number; // hours
  specialRequirements?: string[];
}

// Chat & Assistance Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    confidence?: number;
    suggestedActions?: string[];
  };
}

export interface ChatContext {
  sessionId: string;
  userId: string;
  userType: 'devotee' | 'priest';
  conversationHistory: ChatMessage[];
  context?: {
    currentBooking?: string;
    viewingPriest?: string;
    selectedService?: string;
  };
}

// Quote Generation Types
export interface QuoteRequest {
  serviceId: string;
  requirements: string;
  location: Location;
  proposedDate?: string;
  specialInstructions?: string;
}

export interface GeneratedQuote {
  quoteText: string;
  priceBreakdown: {
    basePrice: number;
    travelFee?: number;
    additionalServices?: Array<{
      name: string;
      price: number;
    }>;
    total: number;
  };
  validUntil: string;
  terms: string[];
  personalizedMessage: string;
}

// Cache Types
export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: string;
  hitCount: number;
  size: number; // in bytes
  tags?: string[];
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // in MB
  hitRate: number;
  oldestEntry: string;
  mostAccessed: string[];
}

// Error Types
export interface AIError {
  code: 'PROVIDER_ERROR' | 'TIMEOUT' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'CACHE_ERROR';
  message: string;
  provider?: 'anthropic' | 'gemini';
  retryAfter?: number; // seconds
}

// Natural Language Booking Types
export interface NaturalLanguageBookingRequest {
  query: string;
  userId: string;
  context?: ChatContext;
}

export interface ParsedBookingIntent {
  serviceType: string;
  datePreferences: {
    specific?: Date;
    range?: { start: Date; end: Date };
    flexibility?: 'exact' | 'flexible' | 'anytime';
  };
  locationPreference?: string;
  budgetRange?: { min: number; max: number };
  specialRequirements: string[];
  confidence: number;
}