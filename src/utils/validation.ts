import { REGEX_PATTERNS, ERROR_MESSAGES } from '../config/constants';

export const validatePhone = (phone: string): string | null => {
  const cleaned = phone.replace(/\D/g, '');
  if (!REGEX_PATTERNS.PHONE.test(cleaned)) {
    return ERROR_MESSAGES.PHONE_INVALID;
  }
  return null;
};

export const validateZipCode = (zipCode: string): string | null => {
  if (!REGEX_PATTERNS.ZIP_CODE.test(zipCode)) {
    return ERROR_MESSAGES.ZIP_CODE_INVALID;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return null; // Email is optional
  if (!REGEX_PATTERNS.EMAIL.test(email)) {
    return ERROR_MESSAGES.EMAIL_INVALID;
  }
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name || name.trim().length < 2) {
    return ERROR_MESSAGES.NAME_INVALID;
  }
  if (!REGEX_PATTERNS.NAME.test(name)) {
    return ERROR_MESSAGES.NAME_INVALID;
  }
  return null;
};

export const validatePrice = (price: number): string | null => {
  if (price < 0) {
    return 'Price cannot be negative';
  }
  if (price < 25) {
    return 'Minimum service price is $25';
  }
  if (price > 10000) {
    return 'Maximum service price is $10,000';
  }
  return null;
};

export const validatePriceRange = (min: number, max: number): string | null => {
  const minError = validatePrice(min);
  if (minError) return minError;
  
  const maxError = validatePrice(max);
  if (maxError) return maxError;
  
  if (min >= max) {
    return 'Maximum price must be greater than minimum price';
  }
  
  return null;
};

export const validateDuration = (duration: number): string | null => {
  if (duration < 15) {
    return 'Service duration must be at least 15 minutes';
  }
  if (duration > 480) {
    return 'Service duration cannot exceed 8 hours';
  }
  if (duration % 15 !== 0) {
    return 'Duration must be in 15-minute increments';
  }
  return null;
};

export const validateServiceDate = (date: Date): string | null => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const serviceDate = new Date(date);
  serviceDate.setHours(0, 0, 0, 0);
  
  if (serviceDate < now) {
    return 'Service date cannot be in the past';
  }
  
  const maxDate = new Date(now);
  maxDate.setMonth(maxDate.getMonth() + 6);
  
  if (serviceDate > maxDate) {
    return 'Service date cannot be more than 6 months in advance';
  }
  
  return null;
};

export const validateTimeSlot = (startTime: string, endTime: string): string | null => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  if (startMinutes >= endMinutes) {
    return 'End time must be after start time';
  }
  
  if (startHour < 6 || endHour > 21) {
    return 'Service hours must be between 6 AM and 9 PM';
  }
  
  return null;
};

export const validateAddress = (address: string): string | null => {
  if (!address || address.trim().length < 10) {
    return 'Please enter a complete address';
  }
  if (address.length > 200) {
    return 'Address is too long';
  }
  return null;
};

export const validateSpecialRequests = (text: string): string | null => {
  if (text.length > 500) {
    return 'Special requests must be under 500 characters';
  }
  return null;
};

export const validateReview = (rating: number, comment: string): string | null => {
  if (rating < 1 || rating > 5) {
    return 'Rating must be between 1 and 5 stars';
  }
  if (comment && comment.length > 500) {
    return 'Review comment must be under 500 characters';
  }
  if (!comment || comment.trim().length < 10) {
    return 'Please provide at least 10 characters in your review';
  }
  return null;
};

export const validateMessage = (message: string): string | null => {
  if (!message || message.trim().length === 0) {
    return 'Message cannot be empty';
  }
  if (message.length > 1000) {
    return 'Message must be under 1000 characters';
  }
  return null;
};

export const validateOTP = (otp: string): string | null => {
  if (!/^\d{6}$/.test(otp)) {
    return 'Please enter a valid 6-digit code';
  }
  return null;
};

// Form validation helper
export interface ValidationRule {
  validator: (value: any) => string | null;
  message?: string;
}

export const validateForm = (
  values: Record<string, any>,
  rules: Record<string, ValidationRule[]>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = values[field];
    
    for (const rule of fieldRules) {
      const error = rule.validator(value);
      if (error) {
        errors[field] = rule.message || error;
        break;
      }
    }
  });
  
  return errors;
};