import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
  addDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import {
  User,
  ServiceOffering,
  Booking,
  BookingRequest,
  NotificationData,
  SavedAddress,
  Message,
  PaginatedResponse,
  FilterOptions,
} from '../types';

// User operations
export const createUser = async (userId: string, userData: User): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) return null;
  
  return {
    id: userDoc.id,
    ...userDoc.data(),
    createdAt: userDoc.data().createdAt?.toDate(),
    updatedAt: userDoc.data().updatedAt?.toDate(),
  } as User;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

// Priest search and filtering
export const searchPriests = async (
  zipCode: string,
  filters?: {
    serviceType?: string;
    language?: string;
    maxDistance?: number;
    priceRange?: { min: number; max: number };
  }
): Promise<User[]> => {
  const constraints: QueryConstraint[] = [
    where('userType', '==', 'priest'),
    where('isActive', '==', true),
  ];
  
  // In a real app, you'd use geohashing or a location-based query
  // For now, we'll filter by ZIP code prefix
  const zipPrefix = zipCode.substring(0, 3);
  constraints.push(where('location.zipCode', '>=', zipPrefix));
  constraints.push(where('location.zipCode', '<=', zipPrefix + '\uf8ff'));
  
  if (filters?.language) {
    constraints.push(where('languages', 'array-contains', filters.language));
  }
  
  const q = query(collection(db, COLLECTIONS.USERS), ...constraints);
  const snapshot = await getDocs(q);
  
  const priests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as User[];
  
  // Additional filtering that can't be done in Firestore
  return priests.filter(priest => {
    if (filters?.serviceType && priest.specializations) {
      return priest.specializations.includes(filters.serviceType);
    }
    return true;
  });
};

// Service operations
export const createService = async (service: Omit<ServiceOffering, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.SERVICES), {
    ...service,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getServicesByPriest = async (priestId: string): Promise<ServiceOffering[]> => {
  const q = query(
    collection(db, COLLECTIONS.SERVICES),
    where('priestId', '==', priestId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as ServiceOffering[];
};

export const updateService = async (serviceId: string, updates: Partial<ServiceOffering>): Promise<void> => {
  const serviceRef = doc(db, COLLECTIONS.SERVICES, serviceId);
  await updateDoc(serviceRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

// Booking operations
export const createBooking = async (bookingRequest: BookingRequest): Promise<Booking> => {
  const bookingData: Omit<Booking, 'id'> = {
    ...bookingRequest,
    status: bookingRequest.quoteRequest ? 'quote_requested' : 'confirmed',
    statusHistory: [{
      status: bookingRequest.quoteRequest ? 'quote_requested' : 'confirmed',
      timestamp: new Date(),
    }],
    messages: [],
    unreadMessagesCount: {
      devotee: 0,
      priest: 0,
    },
    pricing: {} as any, // Will be calculated
    payment: {
      advancePaid: false,
      completionPaid: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const docRef = await addDoc(collection(db, COLLECTIONS.BOOKINGS), {
    ...bookingData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  return {
    id: docRef.id,
    ...bookingData,
  } as Booking;
};

export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  const bookingDoc = await getDoc(bookingRef);
  
  if (!bookingDoc.exists()) return null;
  
  return {
    id: bookingDoc.id,
    ...bookingDoc.data(),
    createdAt: bookingDoc.data().createdAt?.toDate(),
    updatedAt: bookingDoc.data().updatedAt?.toDate(),
  } as Booking;
};

export const updateBooking = async (bookingId: string, updates: any): Promise<void> => {
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  await updateDoc(bookingRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const getUserBookings = async (
  userId: string,
  userType: 'priest' | 'devotee',
  options?: FilterOptions
): Promise<Booking[]> => {
  const field = userType === 'priest' ? 'priestId' : 'devoteeId';
  const constraints: QueryConstraint[] = [
    where(field, '==', userId),
    orderBy('createdAt', 'desc'),
  ];
  
  if (options?.pageSize) {
    constraints.push(limit(options.pageSize));
  }
  
  const q = query(collection(db, COLLECTIONS.BOOKINGS), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Booking[];
};

// Messaging
export const addBookingMessage = async (bookingId: string, message: Message): Promise<void> => {
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  await updateDoc(bookingRef, {
    messages: arrayUnion(message),
    lastMessageAt: Timestamp.now(),
    [`unreadMessagesCount.${message.senderId === 'priest' ? 'devotee' : 'priest'}`]: increment(1),
  });
};

// Notifications
export const getUserNotifications = async (userId: string): Promise<NotificationData[]> => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as NotificationData[];
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: NotificationData[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as NotificationData[];
    
    callback(notifications);
  });
};

export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
  const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await updateDoc(notificationRef, {
    isRead: true,
    readAt: Timestamp.now(),
  });
};

// Favorites and saved addresses
export const addFavoritePriest = async (devoteeId: string, priestId: string): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, devoteeId);
  await updateDoc(userRef, {
    favoritesPriestIds: arrayUnion(priestId),
  });
};

export const removeFavoritePriest = async (devoteeId: string, priestId: string): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, devoteeId);
  await updateDoc(userRef, {
    favoritesPriestIds: arrayRemove(priestId),
  });
};

export const addSavedAddress = async (devoteeId: string, address: SavedAddress): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, devoteeId);
  await updateDoc(userRef, {
    savedAddresses: arrayUnion(address),
  });
};

export const removeSavedAddress = async (devoteeId: string, addressId: string): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, devoteeId);
  const user = await getUser(devoteeId);
  if (!user || user.userType !== 'devotee') return;
  
  const updatedAddresses = user.savedAddresses?.filter(a => a.id !== addressId) || [];
  await updateDoc(userRef, {
    savedAddresses: updatedAddresses,
  });
};

// Reviews
export const addReview = async (
  bookingId: string,
  reviewType: 'devoteeReview' | 'priestReview',
  review: { rating: number; comment: string }
): Promise<void> => {
  const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
  await updateDoc(bookingRef, {
    [`reviews.${reviewType}`]: {
      ...review,
      timestamp: Timestamp.now(),
    },
  });
  
  // Update priest rating if it's a devotee review
  if (reviewType === 'devoteeReview') {
    const booking = await getBooking(bookingId);
    if (booking) {
      const priestRef = doc(db, COLLECTIONS.USERS, booking.priestId);
      await updateDoc(priestRef, {
        reviewCount: increment(1),
        // Rating calculation would be more complex in production
      });
    }
  }
};