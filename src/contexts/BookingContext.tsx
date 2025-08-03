import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';
import { 
  Booking, 
  BookingRequest, 
  QuoteResponse, 
  ServiceOffering, 
  Message,
  BookingStatus,
  PricingBreakdown
} from '../types';
import * as firestoreService from '../services/firestore';
import * as paymentService from '../services/payments/stripeService';
import { useAuth } from './AuthContext';

interface BookingFlow {
  selectedPriestId: string | null;
  selectedServiceId: string | null;
  selectedDate: string | null;
  selectedTimeSlot: { start: string; end: string } | null;
  selectedAddress: string | null;
  selectedCoordinates: { lat: number; lng: number } | null;
  specialRequests: string;
  attendeeCount: number;
  proposedBudget?: number;
}

interface BookingState {
  currentBooking: Booking | null;
  bookingFlow: BookingFlow;
  activeBookings: Booking[];
  pastBookings: Booking[];
  isLoading: boolean;
  error: Error | null;
}

type BookingAction =
  | { type: 'SET_CURRENT_BOOKING'; booking: Booking | null }
  | { type: 'UPDATE_BOOKING_FLOW'; updates: Partial<BookingFlow> }
  | { type: 'RESET_BOOKING_FLOW' }
  | { type: 'SET_ACTIVE_BOOKINGS'; bookings: Booking[] }
  | { type: 'SET_PAST_BOOKINGS'; bookings: Booking[] }
  | { type: 'ADD_MESSAGE'; bookingId: string; message: Message }
  | { type: 'UPDATE_BOOKING_STATUS'; bookingId: string; status: BookingStatus }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: Error | null }
  | { type: 'RESET' };

interface BookingContextValue {
  state: BookingState;
  // Booking flow actions
  updateBookingFlow: (updates: Partial<BookingFlow>) => void;
  resetBookingFlow: () => void;
  createBookingRequest: () => Promise<Booking>;
  
  // Quote actions
  requestQuote: (priestId: string, serviceId: string) => Promise<void>;
  respondToQuote: (bookingId: string, quote: QuoteResponse) => Promise<void>;
  acceptQuote: (bookingId: string) => Promise<void>;
  
  // Booking management
  confirmBooking: (bookingId: string, paymentIntentId: string) => Promise<void>;
  cancelBooking: (bookingId: string, reason: string) => Promise<void>;
  completeBooking: (bookingId: string) => Promise<void>;
  
  // Messaging
  sendMessage: (bookingId: string, message: string) => Promise<void>;
  markMessagesAsRead: (bookingId: string) => Promise<void>;
  
  // Data fetching
  loadUserBookings: () => Promise<void>;
  loadBookingDetails: (bookingId: string) => Promise<void>;
  
  // Calculations
  calculatePricing: (service: ServiceOffering, distance?: number) => PricingBreakdown;
}

const initialBookingFlow: BookingFlow = {
  selectedPriestId: null,
  selectedServiceId: null,
  selectedDate: null,
  selectedTimeSlot: null,
  selectedAddress: null,
  selectedCoordinates: null,
  specialRequests: '',
  attendeeCount: 0,
  proposedBudget: undefined,
};

const initialState: BookingState = {
  currentBooking: null,
  bookingFlow: initialBookingFlow,
  activeBookings: [],
  pastBookings: [],
  isLoading: false,
  error: null,
};

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_CURRENT_BOOKING':
      return { ...state, currentBooking: action.booking, error: null };
    
    case 'UPDATE_BOOKING_FLOW':
      return { 
        ...state, 
        bookingFlow: { ...state.bookingFlow, ...action.updates },
        error: null 
      };
    
    case 'RESET_BOOKING_FLOW':
      return { ...state, bookingFlow: initialBookingFlow };
    
    case 'SET_ACTIVE_BOOKINGS':
      return { ...state, activeBookings: action.bookings };
    
    case 'SET_PAST_BOOKINGS':
      return { ...state, pastBookings: action.bookings };
    
    case 'ADD_MESSAGE':
      const updateBookingMessages = (booking: Booking | null) => {
        if (!booking || booking.id !== action.bookingId) return booking;
        return {
          ...booking,
          messages: [...booking.messages, action.message],
          lastMessageAt: action.message.timestamp,
        };
      };
      
      return {
        ...state,
        currentBooking: updateBookingMessages(state.currentBooking),
        activeBookings: state.activeBookings.map(b => updateBookingMessages(b) || b),
      };
    
    case 'UPDATE_BOOKING_STATUS':
      const updateBookingStatus = (booking: Booking | null) => {
        if (!booking || booking.id !== action.bookingId) return booking;
        return {
          ...booking,
          status: action.status,
          statusHistory: [
            ...booking.statusHistory,
            { status: action.status, timestamp: new Date() }
          ],
        };
      };
      
      return {
        ...state,
        currentBooking: updateBookingStatus(state.currentBooking),
        activeBookings: state.activeBookings.map(b => updateBookingStatus(b) || b),
      };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

const BookingContext = createContext<BookingContextValue | null>(null);

export const useBooking = (): BookingContextValue => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const { state: authState } = useAuth();

  const contextValue = useMemo<BookingContextValue>(() => ({
    state,
    
    updateBookingFlow: (updates: Partial<BookingFlow>) => {
      dispatch({ type: 'UPDATE_BOOKING_FLOW', updates });
    },
    
    resetBookingFlow: () => {
      dispatch({ type: 'RESET_BOOKING_FLOW' });
    },
    
    createBookingRequest: async () => {
      if (!authState.userData) throw new Error('User not authenticated');
      const { bookingFlow } = state;
      
      if (!bookingFlow.selectedPriestId || !bookingFlow.selectedServiceId) {
        throw new Error('Priest and service must be selected');
      }
      
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        const bookingRequest: BookingRequest = {
          devoteeId: authState.userData.id,
          priestId: bookingFlow.selectedPriestId,
          serviceId: bookingFlow.selectedServiceId,
          serviceDetails: {
            type: '', // Will be filled from service
            name: '',
            description: '',
            duration: 0,
            specialRequests: bookingFlow.specialRequests,
            attendeeCount: bookingFlow.attendeeCount,
          },
          scheduling: {
            date: bookingFlow.selectedDate!,
            startTime: bookingFlow.selectedTimeSlot!.start,
            endTime: bookingFlow.selectedTimeSlot!.end,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            address: bookingFlow.selectedAddress!,
            coordinates: bookingFlow.selectedCoordinates!,
          },
        };
        
        if (bookingFlow.proposedBudget) {
          bookingRequest.quoteRequest = {
            requirements: bookingFlow.specialRequests,
            proposedBudget: bookingFlow.proposedBudget,
            preferredDates: [bookingFlow.selectedDate!],
          };
        }
        
        const booking = await firestoreService.createBooking(bookingRequest);
        dispatch({ type: 'SET_CURRENT_BOOKING', booking });
        dispatch({ type: 'RESET_BOOKING_FLOW' });
        return booking;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    
    requestQuote: async (priestId: string, serviceId: string) => {
      // Implementation for quote request
      dispatch({ type: 'UPDATE_BOOKING_FLOW', updates: { selectedPriestId: priestId, selectedServiceId: serviceId } });
    },
    
    respondToQuote: async (bookingId: string, quote: QuoteResponse) => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        await firestoreService.updateBooking(bookingId, {
          quoteProvided: {
            providedAt: new Date(),
            amount: quote.amount,
            validUntil: quote.validUntil,
            customTerms: quote.customTerms,
          },
          status: 'quote_provided',
        });
        dispatch({ type: 'UPDATE_BOOKING_STATUS', bookingId, status: 'quote_provided' });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    
    acceptQuote: async (bookingId: string) => {
      // Implementation for accepting quote and initiating payment
    },
    
    confirmBooking: async (bookingId: string, paymentIntentId: string) => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        await firestoreService.updateBooking(bookingId, {
          'payment.stripePaymentIntentId': paymentIntentId,
          'payment.advancePaid': true,
          'payment.advancePaidAt': new Date(),
          status: 'confirmed',
        });
        dispatch({ type: 'UPDATE_BOOKING_STATUS', bookingId, status: 'confirmed' });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    
    cancelBooking: async (bookingId: string, reason: string) => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        await firestoreService.updateBooking(bookingId, {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          cancelledBy: authState.userData?.userType || 'system',
        });
        dispatch({ type: 'UPDATE_BOOKING_STATUS', bookingId, status: 'cancelled' });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    
    completeBooking: async (bookingId: string) => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        await firestoreService.updateBooking(bookingId, {
          status: 'completed',
          completedAt: new Date(),
        });
        dispatch({ type: 'UPDATE_BOOKING_STATUS', bookingId, status: 'completed' });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    
    sendMessage: async (bookingId: string, message: string) => {
      if (!authState.userData) throw new Error('User not authenticated');
      
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: authState.userData.id,
        senderName: authState.userData.name,
        message,
        timestamp: new Date(),
        type: 'text',
        isRead: false,
      };
      
      try {
        await firestoreService.addBookingMessage(bookingId, newMessage);
        dispatch({ type: 'ADD_MESSAGE', bookingId, message: newMessage });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      }
    },
    
    markMessagesAsRead: async (bookingId: string) => {
      // Implementation for marking messages as read
    },
    
    loadUserBookings: async () => {
      if (!authState.userData) return;
      
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        const bookings = await firestoreService.getUserBookings(
          authState.userData.id,
          authState.userData.userType
        );
        
        const now = new Date();
        const active = bookings.filter(b => 
          ['quote_requested', 'quote_provided', 'confirmed', 'in_progress'].includes(b.status)
        );
        const past = bookings.filter(b => 
          ['completed', 'cancelled'].includes(b.status)
        );
        
        dispatch({ type: 'SET_ACTIVE_BOOKINGS', bookings: active });
        dispatch({ type: 'SET_PAST_BOOKINGS', bookings: past });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    
    loadBookingDetails: async (bookingId: string) => {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      try {
        const booking = await firestoreService.getBooking(bookingId);
        if (booking) {
          dispatch({ type: 'SET_CURRENT_BOOKING', booking });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    
    calculatePricing: (service: ServiceOffering, distance: number = 0): PricingBreakdown => {
      // Implementation for pricing calculation
      return {} as PricingBreakdown;
    },
  }), [state, authState.userData]);

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

// Custom hooks for booking state
export const useBookingFlow = () => {
  const { state, updateBookingFlow, resetBookingFlow } = useBooking();
  return {
    bookingFlow: state.bookingFlow,
    updateBookingFlow,
    resetBookingFlow,
  };
};

export const useActiveBookings = (): Booking[] => {
  const { state } = useBooking();
  return state.activeBookings;
};

export const usePastBookings = (): Booking[] => {
  const { state } = useBooking();
  return state.pastBookings;
};

export const useCurrentBooking = (): Booking | null => {
  const { state } = useBooking();
  return state.currentBooking;
};