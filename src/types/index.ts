// Re-export all types for convenient importing
export * from './user';
export * from './service';
export * from './booking';
export * from './payment';

// Common types used across the app
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TimeSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  bookingId?: string;
}

export interface DateTimeSlot {
  date: string; // YYYY-MM-DD format
  slots: TimeSlot[];
}

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'booking' | 'message' | 'payment' | 'review' | 'system';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface AppError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
}

export type AsyncState<T> = 
  | { status: 'idle'; data?: undefined; error?: undefined }
  | { status: 'loading'; data?: T; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: AppError };