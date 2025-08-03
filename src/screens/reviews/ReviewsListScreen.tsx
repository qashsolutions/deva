import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ReviewCard, ReviewSummary } from '../../components/reviews/ReviewCard';
import { EmptyState } from '../../components/common/EmptyState';
import { InlineLoader } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize } from '../../config/theme';
import { 
  getPriestReviews, 
  getPriestReviewStats,
  markReviewHelpful,
  flagReview,
  addPriestResponse,
} from '../../services/reviews';
import { Review, ReviewStats, ReviewFilters } from '../../types/review';

// Define navigation params
type ReviewsStackParamList = {
  ReviewsList: { priestId: string; priestName?: string };
};

type NavigationProp = NativeStackNavigationProp<ReviewsStackParamList, 'ReviewsList'>;
type RoutePropType = RouteProp<ReviewsStackParamList, 'ReviewsList'>;

export const ReviewsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { priestId, priestName } = route.params;
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>({
    sortBy: 'recent',
  });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const isPriest = currentUser?.uid === priestId;

  useEffect(() => {
    loadReviews();
  }, [priestId, filters]);

  const loadReviews = async () => {
    try {
      const [reviewsData, statsData] = await Promise.all([
        getPriestReviews(priestId, filters),
        getPriestReviewStats(priestId),
      ]);
      
      setReviews(reviewsData);
      setReviewStats(statsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!currentUser) {
      Alert.alert('Sign In Required', 'Please sign in to mark reviews as helpful');
      return;
    }

    try {
      await markReviewHelpful(currentUser.uid, reviewId);
      // Reload reviews to update helpful count
      loadReviews();
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const handleFlagReview = (reviewId: string) => {
    Alert.alert(
      'Report Review',
      'Why are you reporting this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Inappropriate Content', 
          onPress: () => submitFlag(reviewId, 'inappropriate') 
        },
        { 
          text: 'Not Relevant', 
          onPress: () => submitFlag(reviewId, 'not_relevant') 
        },
        { 
          text: 'Spam', 
          onPress: () => submitFlag(reviewId, 'spam') 
        },
      ]
    );
  };

  const submitFlag = async (reviewId: string, reason: string) => {
    try {
      await flagReview(reviewId, reason);
      Alert.alert('Thank You', 'This review has been reported for moderation');
    } catch (error) {
      console.error('Error flagging review:', error);
      Alert.alert('Error', 'Failed to report review');
    }
  };

  const handleRespond = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setSelectedReview(review);
      setShowResponseModal(true);
    }
  };

  const submitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    setSubmittingResponse(true);

    try {
      await addPriestResponse(priestId, {
        reviewId: selectedReview.id,
        comment: responseText.trim(),
      });

      Alert.alert('Success', 'Your response has been posted');
      setShowResponseModal(false);
      setResponseText('');
      setSelectedReview(null);
      
      // Reload reviews
      loadReviews();
    } catch (error) {
      console.error('Error submitting response:', error);
      Alert.alert('Error', 'Failed to post response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {isPriest ? 'My Reviews' : `Reviews for ${priestName || 'Priest'}`}
      </Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <Text style={styles.filterLabel}>Sort by:</Text>
        {[
          { value: 'recent', label: 'Most Recent' },
          { value: 'rating_high', label: 'Highest Rated' },
          { value: 'rating_low', label: 'Lowest Rated' },
          { value: 'helpful', label: 'Most Helpful' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              filters.sortBy === filter.value && styles.filterChipActive,
            ]}
            onPress={() => setFilters({ ...filters, sortBy: filter.value as any })}
          >
            <Text
              style={[
                styles.filterChipText,
                filters.sortBy === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderReview = ({ item }: { item: Review }) => (
    <ReviewCard
      review={item}
      showServiceInfo={true}
      onHelpful={!isPriest ? handleMarkHelpful : undefined}
      onFlag={!isPriest ? handleFlagReview : undefined}
      onRespond={isPriest ? handleRespond : undefined}
      currentUserId={currentUser?.uid}
      isPriest={isPriest}
    />
  );

  const renderContent = () => {
    if (loading) {
      return <InlineLoader text="Loading reviews..." />;
    }

    if (reviews.length === 0) {
      return (
        <EmptyState
          icon="star-outline"
          title="No Reviews Yet"
          message={isPriest 
            ? "You don't have any reviews yet. Keep providing great service!"
            : "This priest doesn't have any reviews yet."
          }
        />
      );
    }

    return (
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          reviewStats ? (
            <ReviewSummary
              averageRating={reviewStats.averageRating}
              totalReviews={reviewStats.totalReviews}
              ratingDistribution={reviewStats.ratingDistribution}
            />
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderFilters()}
      {renderContent()}

      <Modal
        visible={showResponseModal}
        onClose={() => {
          setShowResponseModal(false);
          setResponseText('');
          setSelectedReview(null);
        }}
        title="Respond to Review"
      >
        <TextInput
          style={styles.responseInput}
          placeholder="Write your response..."
          value={responseText}
          onChangeText={setResponseText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={colors.gray[400]}
        />
        
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancel}
            onPress={() => {
              setShowResponseModal(false);
              setResponseText('');
              setSelectedReview(null);
            }}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Button
            title="Post Response"
            onPress={submitResponse}
            loading={submittingResponse}
            disabled={!responseText.trim() || submittingResponse}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.small,
  },
  headerTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterScroll: {
    paddingHorizontal: spacing.medium,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginRight: spacing.medium,
  },
  filterChip: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.xsmall,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    marginRight: spacing.small,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: spacing.medium,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: spacing.medium,
    fontSize: fontSize.medium,
    color: colors.text.primary,
    minHeight: 100,
    marginBottom: spacing.medium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalCancel: {
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
  },
  modalCancelText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
});