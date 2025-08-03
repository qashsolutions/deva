import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import { User, PriestProfile, DevoteeProfile, SavedAddress, NotificationData } from '../types';
import { useAuth } from './AuthContext';
import * as firestoreService from '../services/firestore';

interface UserState {
  profile: User | null;
  notifications: NotificationData[];
  unreadNotifications: number;
  favoritesPriests: string[];
  loyaltyCredits: number;
  isUpdating: boolean;
  error: Error | null;
}

type UserAction =
  | { type: 'SET_PROFILE'; profile: User }
  | { type: 'UPDATE_PROFILE'; updates: Partial<User> }
  | { type: 'SET_NOTIFICATIONS'; notifications: NotificationData[] }
  | { type: 'MARK_NOTIFICATION_READ'; notificationId: string }
  | { type: 'ADD_FAVORITE_PRIEST'; priestId: string }
  | { type: 'REMOVE_FAVORITE_PRIEST'; priestId: string }
  | { type: 'UPDATE_LOYALTY_CREDITS'; amount: number }
  | { type: 'ADD_SAVED_ADDRESS'; address: SavedAddress }
  | { type: 'REMOVE_SAVED_ADDRESS'; addressId: string }
  | { type: 'SET_UPDATING'; isUpdating: boolean }
  | { type: 'SET_ERROR'; error: Error | null }
  | { type: 'RESET' };

interface UserContextValue {
  state: UserState;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateLocation: (zipCode: string, address?: string) => Promise<void>;
  toggleFavoritePriest: (priestId: string) => Promise<void>;
  addSavedAddress: (address: SavedAddress) => Promise<void>;
  removeSavedAddress: (addressId: string) => Promise<void>;
  updateNotificationSettings: (settings: User['notificationSettings']) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const initialState: UserState = {
  profile: null,
  notifications: [],
  unreadNotifications: 0,
  favoritesPriests: [],
  loyaltyCredits: 0,
  isUpdating: false,
  error: null,
};

const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.profile,
        favoritesPriests: (action.profile as DevoteeProfile)?.favoritesPriestIds || [],
        loyaltyCredits: (action.profile as DevoteeProfile)?.loyaltyData?.credits || 0,
        error: null,
      };
    
    case 'UPDATE_PROFILE':
      if (!state.profile) return state;
      return {
        ...state,
        profile: { ...state.profile, ...action.updates },
        error: null,
      };
    
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.notifications,
        unreadNotifications: action.notifications.filter(n => !n.isRead).length,
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.notificationId ? { ...n, isRead: true } : n
        ),
        unreadNotifications: Math.max(0, state.unreadNotifications - 1),
      };
    
    case 'ADD_FAVORITE_PRIEST':
      return {
        ...state,
        favoritesPriests: [...state.favoritesPriests, action.priestId],
      };
    
    case 'REMOVE_FAVORITE_PRIEST':
      return {
        ...state,
        favoritesPriests: state.favoritesPriests.filter(id => id !== action.priestId),
      };
    
    case 'UPDATE_LOYALTY_CREDITS':
      return {
        ...state,
        loyaltyCredits: state.loyaltyCredits + action.amount,
      };
    
    case 'ADD_SAVED_ADDRESS':
      if (!state.profile || state.profile.userType !== 'devotee') return state;
      const devoteeProfile = state.profile as DevoteeProfile;
      return {
        ...state,
        profile: {
          ...devoteeProfile,
          savedAddresses: [...(devoteeProfile.savedAddresses || []), action.address],
        },
      };
    
    case 'REMOVE_SAVED_ADDRESS':
      if (!state.profile || state.profile.userType !== 'devotee') return state;
      const profile = state.profile as DevoteeProfile;
      return {
        ...state,
        profile: {
          ...profile,
          savedAddresses: profile.savedAddresses?.filter(a => a.id !== action.addressId) || [],
        },
      };
    
    case 'SET_UPDATING':
      return { ...state, isUpdating: action.isUpdating };
    
    case 'SET_ERROR':
      return { ...state, error: action.error };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

const UserContext = createContext<UserContextValue | null>(null);

export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  const { state: authState } = useAuth();

  // Sync user profile with auth state
  useEffect(() => {
    if (authState.userData) {
      dispatch({ type: 'SET_PROFILE', profile: authState.userData });
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [authState.userData]);

  // Load notifications when user is authenticated
  useEffect(() => {
    if (!authState.userData) return;

    const loadNotifications = async () => {
      try {
        const notifications = await firestoreService.getUserNotifications(authState.userData.id);
        dispatch({ type: 'SET_NOTIFICATIONS', notifications });
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();

    // Subscribe to real-time notifications
    const unsubscribe = firestoreService.subscribeToNotifications(
      authState.userData.id,
      (notifications) => {
        dispatch({ type: 'SET_NOTIFICATIONS', notifications });
      }
    );

    return () => unsubscribe();
  }, [authState.userData]);

  const contextValue = useMemo<UserContextValue>(() => ({
    state,
    
    updateProfile: async (updates: Partial<User>) => {
      if (!state.profile) throw new Error('No user profile');
      
      dispatch({ type: 'SET_UPDATING', isUpdating: true });
      try {
        await firestoreService.updateUser(state.profile.id, updates);
        dispatch({ type: 'UPDATE_PROFILE', updates });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_UPDATING', isUpdating: false });
      }
    },
    
    updateLocation: async (zipCode: string, address?: string) => {
      if (!state.profile) throw new Error('No user profile');
      
      const locationUpdate = {
        location: {
          ...state.profile.location,
          zipCode,
          address: address || state.profile.location.address,
        },
      };
      
      await contextValue.updateProfile(locationUpdate);
    },
    
    toggleFavoritePriest: async (priestId: string) => {
      if (!state.profile || state.profile.userType !== 'devotee') {
        throw new Error('Only devotees can favorite priests');
      }
      
      const isFavorite = state.favoritesPriests.includes(priestId);
      
      dispatch({ type: 'SET_UPDATING', isUpdating: true });
      try {
        if (isFavorite) {
          await firestoreService.removeFavoritePriest(state.profile.id, priestId);
          dispatch({ type: 'REMOVE_FAVORITE_PRIEST', priestId });
        } else {
          await firestoreService.addFavoritePriest(state.profile.id, priestId);
          dispatch({ type: 'ADD_FAVORITE_PRIEST', priestId });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_UPDATING', isUpdating: false });
      }
    },
    
    addSavedAddress: async (address: SavedAddress) => {
      if (!state.profile || state.profile.userType !== 'devotee') {
        throw new Error('Only devotees can save addresses');
      }
      
      dispatch({ type: 'SET_UPDATING', isUpdating: true });
      try {
        await firestoreService.addSavedAddress(state.profile.id, address);
        dispatch({ type: 'ADD_SAVED_ADDRESS', address });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_UPDATING', isUpdating: false });
      }
    },
    
    removeSavedAddress: async (addressId: string) => {
      if (!state.profile || state.profile.userType !== 'devotee') {
        throw new Error('Only devotees can remove addresses');
      }
      
      dispatch({ type: 'SET_UPDATING', isUpdating: true });
      try {
        await firestoreService.removeSavedAddress(state.profile.id, addressId);
        dispatch({ type: 'REMOVE_SAVED_ADDRESS', addressId });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_UPDATING', isUpdating: false });
      }
    },
    
    updateNotificationSettings: async (settings: User['notificationSettings']) => {
      await contextValue.updateProfile({ notificationSettings: settings });
    },
    
    markNotificationAsRead: async (notificationId: string) => {
      if (!state.profile) throw new Error('No user profile');
      
      try {
        await firestoreService.markNotificationAsRead(state.profile.id, notificationId);
        dispatch({ type: 'MARK_NOTIFICATION_READ', notificationId });
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    
    refreshProfile: async () => {
      if (!state.profile) throw new Error('No user profile');
      
      dispatch({ type: 'SET_UPDATING', isUpdating: true });
      try {
        const updatedProfile = await firestoreService.getUser(state.profile.id);
        if (updatedProfile) {
          dispatch({ type: 'SET_PROFILE', profile: updatedProfile });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', error: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_UPDATING', isUpdating: false });
      }
    },
  }), [state, contextValue]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hooks for specific user data
export const useUserProfile = (): User | null => {
  const { state } = useUser();
  return state.profile;
};

export const usePriestProfile = (): PriestProfile | null => {
  const profile = useUserProfile();
  return profile?.userType === 'priest' ? profile as PriestProfile : null;
};

export const useDevoteeProfile = (): DevoteeProfile | null => {
  const profile = useUserProfile();
  return profile?.userType === 'devotee' ? profile as DevoteeProfile : null;
};

export const useNotifications = () => {
  const { state } = useUser();
  return {
    notifications: state.notifications,
    unreadCount: state.unreadNotifications,
  };
};

export const useLoyaltyCredits = (): number => {
  const { state } = useUser();
  return state.loyaltyCredits;
};