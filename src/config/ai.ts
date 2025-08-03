import { Platform } from 'react-native';

export interface AIProvider {
  name: 'anthropic' | 'gemini';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxCacheSize: number; // In MB
  maxEntries: number;
}

export interface AIConfig {
  providers: {
    anthropic: AIProvider;
    gemini: AIProvider;
  };
  primaryProvider: 'anthropic' | 'gemini';
  fallbackProvider: 'anthropic' | 'gemini';
  caching: CacheConfig;
  retryAttempts: number;
  timeout: number; // Request timeout in ms
  features: {
    smartSearch: boolean;
    ceremonyGuide: boolean;
    pricingOptimization: boolean;
    naturalLanguageBooking: boolean;
  };
}

const config: AIConfig = {
  providers: {
    anthropic: {
      name: 'anthropic',
      apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 1000,
      temperature: 0.7,
    },
    gemini: {
      name: 'gemini',
      apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
      model: 'gemini-1.5-pro',
      maxTokens: 1000,
      temperature: 0.7,
    },
  },
  
  primaryProvider: 'anthropic',
  fallbackProvider: 'gemini',
  
  caching: {
    enabled: true,
    ttl: 3600, // 1 hour for ceremony guides
    maxCacheSize: 50, // 50MB cache limit
    maxEntries: 100,
  },
  
  retryAttempts: 2,
  timeout: 30000, // 30 second timeout
  
  features: {
    smartSearch: true,
    ceremonyGuide: true,
    pricingOptimization: true,
    naturalLanguageBooking: true,
  },
};

// Platform-specific adjustments
if (Platform.OS === 'web') {
  config.caching.maxCacheSize = 25; // Smaller cache for web
}

// Validate configuration
export const validateAIConfig = (): boolean => {
  const { providers, primaryProvider, fallbackProvider } = config;
  
  // Check if API keys are provided
  if (!providers[primaryProvider].apiKey) {
    console.warn(`No API key provided for primary provider: ${primaryProvider}`);
    return false;
  }
  
  if (!providers[fallbackProvider].apiKey && primaryProvider !== fallbackProvider) {
    console.warn(`No API key provided for fallback provider: ${fallbackProvider}`);
  }
  
  return true;
};

// Get provider configuration
export const getProviderConfig = (providerName: 'anthropic' | 'gemini'): AIProvider => {
  return config.providers[providerName];
};

// Check if a feature is enabled
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return config.features[feature];
};

export default config;