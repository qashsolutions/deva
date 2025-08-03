import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { User, UserType } from '../types';
import * as authService from '../services/auth';
import { AsyncState } from '../types';

interface AuthState {
  user: FirebaseUser | null;
  userData: User | null;
  authState: AsyncState<User>;
  isInitialized: boolean;
}

type AuthAction =
  | { type: 'AUTH_STATE_CHANGED'; user: FirebaseUser | null }
  | { type: 'USER_DATA_LOADED'; userData: User }
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_ERROR'; error: Error }
  | { type: 'AUTH_INITIALIZED' }
  | { type: 'SIGN_OUT' };

interface AuthContextValue {
  state: AuthState;
  signInWithPhone: (phoneNumber: string) => Promise<string>;
  verifyOTP: (verificationId: string, code: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPriest: boolean;
  isDevotee: boolean;
}

const initialState: AuthState = {
  user: null,
  userData: null,
  authState: { status: 'idle' },
  isInitialized: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_STATE_CHANGED':
      return {
        ...state,
        user: action.user,
        authState: action.user ? { status: 'loading' } : { status: 'idle' },
        userData: action.user ? state.userData : null,
      };
    
    case 'USER_DATA_LOADED':
      return {
        ...state,
        userData: action.userData,
        authState: { status: 'success', data: action.userData },
      };
    
    case 'AUTH_LOADING':
      return {
        ...state,
        authState: { status: 'loading', data: state.userData || undefined },
      };
    
    case 'AUTH_ERROR':
      return {
        ...state,
        authState: { 
          status: 'error', 
          error: { 
            name: 'AuthError', 
            message: action.error.message,
            code: 'AUTH_ERROR'
          } 
        },
      };
    
    case 'AUTH_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
      };
    
    case 'SIGN_OUT':
      return initialState;
    
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      dispatch({ type: 'AUTH_STATE_CHANGED', user: firebaseUser });
      
      if (firebaseUser) {
        try {
          const userData = await authService.getUserData(firebaseUser.uid);
          if (userData) {
            dispatch({ type: 'USER_DATA_LOADED', userData });
          } else {
            // User exists in Firebase Auth but not in Firestore
            dispatch({ type: 'AUTH_ERROR', error: new Error('User data not found') });
          }
        } catch (error) {
          dispatch({ type: 'AUTH_ERROR', error: error as Error });
        }
      }
      
      if (!state.isInitialized) {
        dispatch({ type: 'AUTH_INITIALIZED' });
      }
    });

    return () => unsubscribe();
  }, [state.isInitialized]);

  const contextValue = useMemo<AuthContextValue>(() => ({
    state,
    
    signInWithPhone: async (phoneNumber: string) => {
      dispatch({ type: 'AUTH_LOADING' });
      try {
        const verificationId = await authService.signInWithPhone(phoneNumber);
        return verificationId;
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR', error: error as Error });
        throw error;
      }
    },
    
    verifyOTP: async (verificationId: string, code: string) => {
      dispatch({ type: 'AUTH_LOADING' });
      try {
        const userData = await authService.verifyOTP(verificationId, code);
        if (userData) {
          dispatch({ type: 'USER_DATA_LOADED', userData });
        }
        return userData;
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR', error: error as Error });
        throw error;
      }
    },
    
    signOut: async () => {
      try {
        await authService.signOut();
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    },
    
    updateUserProfile: async (updates: Partial<User>) => {
      if (!state.userData) {
        throw new Error('No user logged in');
      }
      
      dispatch({ type: 'AUTH_LOADING' });
      try {
        const updatedUser = await authService.updateUserProfile(state.userData.id, updates);
        dispatch({ type: 'USER_DATA_LOADED', userData: updatedUser });
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR', error: error as Error });
        throw error;
      }
    },
    
    deleteAccount: async () => {
      if (!state.user) {
        throw new Error('No user logged in');
      }
      
      try {
        await authService.deleteAccount(state.user.uid);
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Delete account error:', error);
        throw error;
      }
    },
    
    isAuthenticated: !!state.user && !!state.userData,
    isLoading: state.authState.status === 'loading',
    isPriest: state.userData?.userType === 'priest',
    isDevotee: state.userData?.userType === 'devotee',
  }), [state]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hooks for specific auth states
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};

export const useCurrentUser = (): User | null => {
  const { state } = useAuth();
  return state.userData;
};

export const useUserType = (): UserType | null => {
  const user = useCurrentUser();
  return user?.userType || null;
};

export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuth();
  return isLoading;
};