import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  User as FirebaseUser,
  deleteUser,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { User, UserType } from '../types';
import { COLLECTIONS } from '../config/firebase';

let recaptchaVerifier: RecaptchaVerifier | null = null;

// Initialize reCAPTCHA verifier for phone auth
export const initializeRecaptcha = (containerId: string = 'recaptcha-container'): void => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        // Response expired, ask user to re-verify
        console.log('reCAPTCHA expired');
        recaptchaVerifier = null;
      }
    });
  }
};

// Clean up reCAPTCHA verifier
export const clearRecaptcha = (): void => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

// Sign in with phone number
export const signInWithPhone = async (phoneNumber: string): Promise<string> => {
  try {
    // Ensure phone number is in E.164 format
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/\D/g, '')}`;
    
    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA not initialized');
    }
    
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    
    // Store the verification ID (in a real app, you might want to store this more securely)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('verificationId', confirmationResult.verificationId);
    }
    
    return confirmationResult.verificationId;
  } catch (error: any) {
    console.error('Phone auth error:', error);
    throw new Error(error.message || 'Failed to send verification code');
  }
};

// Verify OTP code
export const verifyOTP = async (verificationId: string, code: string): Promise<User | null> => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;
    
    // Check if user exists in Firestore
    let userData = await getUserData(firebaseUser.uid);
    
    if (!userData) {
      // New user - they need to complete profile setup
      // Return null to indicate profile setup is needed
      return null;
    }
    
    // Update last active timestamp
    await updateLastActive(firebaseUser.uid);
    
    return userData;
  } catch (error: any) {
    console.error('OTP verification error:', error);
    throw new Error(error.message || 'Invalid verification code');
  }
};

// Create new user profile
export const createUserProfile = async (
  userId: string,
  userType: UserType,
  profileData: Partial<User>
): Promise<User> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    const newUser: User = {
      id: userId,
      phone: auth.currentUser?.phoneNumber || '',
      userType,
      name: profileData.name || '',
      email: profileData.email,
      profileImage: profileData.profileImage,
      location: profileData.location || { zipCode: '' },
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationSettings: {
        bookingUpdates: true,
        messages: true,
        promotions: true,
        reminders: true,
      },
      ...profileData,
    };
    
    await setDoc(userRef, newUser);
    
    // Update Firebase Auth display name
    if (auth.currentUser && profileData.name) {
      await updateProfile(auth.currentUser, { displayName: profileData.name });
    }
    
    return newUser;
  } catch (error: any) {
    console.error('Create profile error:', error);
    throw new Error(error.message || 'Failed to create user profile');
  }
};

// Get user data from Firestore
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data(),
      createdAt: userDoc.data().createdAt?.toDate() || new Date(),
      updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
    } as User;
  } catch (error: any) {
    console.error('Get user data error:', error);
    throw new Error(error.message || 'Failed to get user data');
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };
    
    await updateDoc(userRef, updateData);
    
    // Update Firebase Auth display name if changed
    if (auth.currentUser && updates.name) {
      await updateProfile(auth.currentUser, { displayName: updates.name });
    }
    
    const updatedUser = await getUserData(userId);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    
    return updatedUser;
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

// Update last active timestamp
export const updateLastActive = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      lastActiveAt: new Date(),
    });
  } catch (error) {
    console.error('Update last active error:', error);
    // Non-critical error, don't throw
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    clearRecaptcha();
    
    // Clear session storage
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('verificationId');
    }
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Delete user account
export const deleteAccount = async (userId: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    
    // Delete user data from Firestore
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(userRef);
    
    // Delete user from Firebase Auth
    await deleteUser(auth.currentUser);
    
    clearRecaptcha();
  } catch (error: any) {
    console.error('Delete account error:', error);
    throw new Error(error.message || 'Failed to delete account');
  }
};

// Check if phone number is already registered
export const checkPhoneExists = async (phoneNumber: string): Promise<boolean> => {
  // This would require a Cloud Function to check securely
  // For now, we'll handle this during the sign-in flow
  return false;
};

// Get current authenticated user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return auth.onAuthStateChanged(callback);
};