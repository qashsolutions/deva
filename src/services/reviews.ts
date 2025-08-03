import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { 
  Review, 
  ReviewStats, 
  CreateReviewInput, 
  ReviewResponse,
  ReviewFilters 
} from '../types/review';
import { sendLocalNotification, createNotificationContent } from './notifications';

// Create a new review
export const createReview = async (
  userId: string,
  input: CreateReviewInput
): Promise<Review> => {
  try {
    // Get booking details
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, input.bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      throw new Error('Booking not found');
    }
    
    const booking = bookingDoc.data();
    
    // Check if review already exists
    const existingReviewQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('bookingId', '==', input.bookingId),
      where('devoteeId', '==', userId)
    );
    const existingReviews = await getDocs(existingReviewQuery);
    
    if (!existingReviews.empty) {
      throw new Error('Review already exists for this booking');
    }
    
    // Create review
    const reviewId = `${input.bookingId}_${userId}`;
    const review: Review = {
      id: reviewId,
      bookingId: input.bookingId,
      priestId: booking.priestId,
      devoteeId: userId,
      rating: input.rating,
      comment: input.comment,
      serviceName: booking.serviceName,
      serviceDate: booking.scheduledDate.toDate(),
      helpfulVotes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: true,
      isFlagged: false,
      moderationStatus: 'approved', // Auto-approve for now
    };
    
    // Use transaction to update priest stats
    await runTransaction(db, async (transaction) => {
      // Create review
      const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
      transaction.set(reviewRef, {
        ...review,
        createdAt: Timestamp.fromDate(review.createdAt),
        updatedAt: Timestamp.fromDate(review.updatedAt),
        serviceDate: Timestamp.fromDate(review.serviceDate),
      });
      
      // Update priest stats
      const priestRef = doc(db, COLLECTIONS.USERS, booking.priestId);
      const priestDoc = await transaction.get(priestRef);
      
      if (priestDoc.exists()) {
        const priestData = priestDoc.data();
        const currentRating = priestData.priestProfile?.averageRating || 0;
        const currentCount = priestData.priestProfile?.totalReviews || 0;
        
        // Calculate new average
        const newTotal = (currentRating * currentCount) + input.rating;
        const newCount = currentCount + 1;
        const newAverage = newTotal / newCount;
        
        transaction.update(priestRef, {
          'priestProfile.averageRating': newAverage,
          'priestProfile.totalReviews': newCount,
          'priestProfile.lastReviewAt': Timestamp.now(),
        });
      }
      
      // Mark booking as reviewed
      transaction.update(bookingRef, {
        hasReview: true,
        reviewId: reviewId,
      });
    });
    
    // Send notification to priest
    await sendLocalNotification(
      createNotificationContent('NEW_REVIEW', {
        reviewerName: booking.devoteeName,
        rating: input.rating,
        bookingId: input.bookingId,
      })
    );
    
    return review;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

// Get reviews for a priest
export const getPriestReviews = async (
  priestId: string,
  filters?: ReviewFilters
): Promise<Review[]> => {
  try {
    let reviewQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('priestId', '==', priestId),
      where('isPublished', '==', true)
    );
    
    // Apply filters
    if (filters?.rating) {
      reviewQuery = query(reviewQuery, where('rating', '==', filters.rating));
    }
    
    // Apply sorting
    switch (filters?.sortBy) {
      case 'rating_high':
        reviewQuery = query(reviewQuery, orderBy('rating', 'desc'));
        break;
      case 'rating_low':
        reviewQuery = query(reviewQuery, orderBy('rating', 'asc'));
        break;
      case 'helpful':
        reviewQuery = query(reviewQuery, orderBy('helpfulVotes', 'desc'));
        break;
      default:
        reviewQuery = query(reviewQuery, orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(reviewQuery);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      serviceDate: doc.data().serviceDate.toDate(),
      priestResponse: doc.data().priestResponse ? {
        ...doc.data().priestResponse,
        respondedAt: doc.data().priestResponse.respondedAt.toDate(),
      } : undefined,
    } as Review));
  } catch (error) {
    console.error('Error fetching priest reviews:', error);
    throw error;
  }
};

// Get review stats for a priest
export const getPriestReviewStats = async (priestId: string): Promise<ReviewStats> => {
  try {
    const reviews = await getPriestReviews(priestId);
    
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    
    let totalRating = 0;
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      totalRating += review.rating;
    });
    
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
      recentReviews: reviews.slice(0, 5),
    };
  } catch (error) {
    console.error('Error calculating review stats:', error);
    throw error;
  }
};

// Add priest response to a review
export const addPriestResponse = async (
  priestId: string,
  response: ReviewResponse
): Promise<void> => {
  try {
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, response.reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }
    
    if (reviewDoc.data().priestId !== priestId) {
      throw new Error('Not authorized to respond to this review');
    }
    
    await updateDoc(reviewRef, {
      priestResponse: {
        comment: response.comment,
        respondedAt: Timestamp.now(),
      },
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding priest response:', error);
    throw error;
  }
};

// Mark review as helpful
export const markReviewHelpful = async (
  userId: string,
  reviewId: string
): Promise<void> => {
  try {
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (!reviewDoc.exists()) {
      throw new Error('Review not found');
    }
    
    const helpfulVotes = reviewDoc.data().helpfulVotes || [];
    
    if (helpfulVotes.includes(userId)) {
      // Remove vote
      await updateDoc(reviewRef, {
        helpfulVotes: helpfulVotes.filter((id: string) => id !== userId),
      });
    } else {
      // Add vote
      await updateDoc(reviewRef, {
        helpfulVotes: [...helpfulVotes, userId],
      });
    }
  } catch (error) {
    console.error('Error marking review helpful:', error);
    throw error;
  }
};

// Flag review for moderation
export const flagReview = async (
  reviewId: string,
  reason: string
): Promise<void> => {
  try {
    const reviewRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    
    await updateDoc(reviewRef, {
      isFlagged: true,
      moderationStatus: 'pending',
      moderationReason: reason,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error flagging review:', error);
    throw error;
  }
};

// Get user's reviews
export const getUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    const reviewQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('devoteeId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(reviewQuery);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      serviceDate: doc.data().serviceDate.toDate(),
      priestResponse: doc.data().priestResponse ? {
        ...doc.data().priestResponse,
        respondedAt: doc.data().priestResponse.respondedAt.toDate(),
      } : undefined,
    } as Review));
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
};

// Check if user can review a booking
export const canReviewBooking = async (
  userId: string,
  bookingId: string
): Promise<boolean> => {
  try {
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      return false;
    }
    
    const booking = bookingDoc.data();
    
    // Check if user is the devotee
    if (booking.devoteeId !== userId) {
      return false;
    }
    
    // Check if booking is completed
    if (booking.status !== 'completed') {
      return false;
    }
    
    // Check if review already exists
    if (booking.hasReview) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return false;
  }
};