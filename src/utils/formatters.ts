export const formatCurrency = (
  amount: number,
  options: {
    showCents?: boolean;
    showSymbol?: boolean;
    locale?: string;
  } = {}
): string => {
  const {
    showCents = true,
    showSymbol = true,
    locale = 'en-US'
  } = options;
  
  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  
  return formatter.format(amount);
};

export const formatPercentage = (
  value: number,
  decimals: number = 0
): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

export const formatName = (
  firstName: string,
  lastName?: string,
  options: {
    includeTitle?: string;
    formal?: boolean;
  } = {}
): string => {
  const { includeTitle, formal } = options;
  
  let name = '';
  
  if (includeTitle) {
    name += includeTitle + ' ';
  }
  
  if (formal && lastName) {
    name += lastName + ', ' + firstName;
  } else {
    name += firstName;
    if (lastName) {
      name += ' ' + lastName;
    }
  }
  
  return name.trim();
};

export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

export const pluralize = (
  count: number,
  singular: string,
  plural?: string
): string => {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

export const formatReviewCount = (count: number): string => {
  if (count === 0) return 'No reviews';
  if (count === 1) return '1 review';
  if (count < 1000) return `${count} reviews`;
  return `${(count / 1000).toFixed(1)}k reviews`;
};

export const formatServiceList = (services: string[]): string => {
  if (services.length === 0) return '';
  if (services.length === 1) return services[0];
  if (services.length === 2) return services.join(' and ');
  
  const lastService = services[services.length - 1];
  const otherServices = services.slice(0, -1);
  return `${otherServices.join(', ')}, and ${lastService}`;
};

export const formatZipCode = (zipCode: string): string => {
  const cleaned = zipCode.replace(/\D/g, '');
  if (cleaned.length === 5) return cleaned;
  if (cleaned.length === 9) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  return zipCode;
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ');
};

export const formatOrdinal = (num: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

export const formatBookingStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    quote_requested: 'Quote Requested',
    quote_provided: 'Quote Provided',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  
  return statusMap[status] || capitalizeWords(status.replace(/_/g, ' '));
};

export const formatPaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    requires_payment: 'Payment Required',
    processing: 'Processing',
    held_in_escrow: 'Held in Escrow',
    partially_released: 'Partially Released',
    completed: 'Completed',
    refunded: 'Refunded',
    failed: 'Failed',
  };
  
  return statusMap[status] || capitalizeWords(status.replace(/_/g, ' '));
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};