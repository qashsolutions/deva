export interface Review {
  id: string;
  bookingId: string;
  priestId: string;
  devoteeId: string;
  rating: number; // 1-5 stars
  comment: string;
  
  // Service details
  serviceName: string;
  serviceDate: Date;
  
  // Response from priest (optional)
  priestResponse?: {
    comment: string;
    respondedAt: Date;
  };
  
  // Helpful votes
  helpfulVotes: string[]; // Array of user IDs who found this helpful
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Moderation
  isPublished: boolean;
  isFlagged: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: Review[];
}

export interface ReviewFilters {
  rating?: number;
  serviceType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasResponse?: boolean;
  sortBy?: 'recent' | 'rating_high' | 'rating_low' | 'helpful';
}

export interface CreateReviewInput {
  bookingId: string;
  rating: number;
  comment: string;
}

export interface ReviewResponse {
  reviewId: string;
  comment: string;
}

// Review prompt questions for better feedback
export interface ReviewPrompts {
  punctuality: number; // 1-5
  professionalism: number; // 1-5
  knowledge: number; // 1-5
  communication: number; // 1-5
  wouldRecommend: boolean;
}