import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatDate } from '../../utils/formatters';
import { Review } from '../../types/review';

interface ReviewCardProps {
  review: Review;
  showServiceInfo?: boolean;
  onHelpful?: (reviewId: string) => void;
  onFlag?: (reviewId: string) => void;
  onRespond?: (reviewId: string) => void;
  currentUserId?: string;
  isPriest?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  showServiceInfo = true,
  onHelpful,
  onFlag,
  onRespond,
  currentUserId,
  isPriest = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isHelpful = currentUserId && review.helpfulVotes.includes(currentUserId);

  const renderStars = () => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= review.rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= review.rating ? colors.warning : colors.gray[400]}
          />
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Avatar
        name={review.devoteeId}
        size="small"
      />
      <View style={styles.headerInfo}>
        <View style={styles.headerTop}>
          <Text style={styles.reviewerName}>Anonymous Devotee</Text>
          {renderStars()}
        </View>
        <View style={styles.headerBottom}>
          <Text style={styles.date}>
            {formatDate(new Date(review.createdAt), 'MMM d, yyyy')}
          </Text>
          {showServiceInfo && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.serviceName}>{review.serviceName}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    const shouldTruncate = review.comment.length > 150 && !expanded;
    const displayText = shouldTruncate 
      ? `${review.comment.substring(0, 150)}...` 
      : review.comment;

    return (
      <View style={styles.content}>
        <Text style={styles.comment}>{displayText}</Text>
        {review.comment.length > 150 && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)}>
            <Text style={styles.expandButton}>
              {expanded ? 'Show less' : 'Read more'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPriestResponse = () => {
    if (!review.priestResponse) return null;

    return (
      <View style={styles.responseContainer}>
        <View style={styles.responseHeader}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
          <Text style={styles.responseTitle}>Priest's Response</Text>
        </View>
        <Text style={styles.responseText}>{review.priestResponse.comment}</Text>
        <Text style={styles.responseDate}>
          {formatDate(new Date(review.priestResponse.respondedAt), 'MMM d, yyyy')}
        </Text>
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actions}>
      {onHelpful && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onHelpful(review.id)}
        >
          <Ionicons
            name={isHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
            size={18}
            color={isHelpful ? colors.primary : colors.gray[600]}
          />
          <Text style={[
            styles.actionText,
            isHelpful && styles.actionTextActive
          ]}>
            Helpful ({review.helpfulVotes.length})
          </Text>
        </TouchableOpacity>
      )}

      {isPriest && !review.priestResponse && onRespond && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onRespond(review.id)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
          <Text style={[styles.actionText, styles.actionTextActive]}>Respond</Text>
        </TouchableOpacity>
      )}

      {onFlag && !isPriest && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onFlag(review.id)}
        >
          <Ionicons name="flag-outline" size={18} color={colors.gray[600]} />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Card style={styles.container}>
      {renderHeader()}
      {renderContent()}
      {renderPriestResponse()}
      {renderActions()}
    </Card>
  );
};

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  onViewAll?: () => void;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  averageRating,
  totalReviews,
  ratingDistribution,
  onViewAll,
}) => {
  const maxCount = Math.max(...Object.values(ratingDistribution));

  return (
    <Card style={styles.summaryContainer}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryLeft}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
          <View style={styles.summaryStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name="star"
                size={20}
                color={star <= Math.round(averageRating) ? colors.warning : colors.gray[300]}
              />
            ))}
          </View>
          <Text style={styles.totalReviews}>{totalReviews} reviews</Text>
        </View>

        <View style={styles.summaryRight}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <View key={rating} style={styles.ratingRow}>
              <Text style={styles.ratingNumber}>{rating}</Text>
              <View style={styles.ratingBar}>
                <View
                  style={[
                    styles.ratingFill,
                    {
                      width: maxCount > 0 
                        ? `${(ratingDistribution[rating as keyof typeof ratingDistribution] / maxCount) * 100}%`
                        : '0%',
                    },
                  ]}
                />
              </View>
              <Text style={styles.ratingCount}>
                {ratingDistribution[rating as keyof typeof ratingDistribution]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {onViewAll && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All Reviews</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.medium,
    marginBottom: spacing.small,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xsmall,
  },
  reviewerName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stars: {
    flexDirection: 'row',
    gap: spacing.xsmall,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  separator: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginHorizontal: spacing.xsmall,
  },
  serviceName: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  content: {
    marginBottom: spacing.medium,
  },
  comment: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.5,
  },
  expandButton: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xsmall,
  },
  responseContainer: {
    backgroundColor: colors.gray[50],
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
    marginBottom: spacing.small,
  },
  responseTitle: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.primary,
  },
  responseText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.4,
    marginBottom: spacing.xsmall,
  },
  responseDate: {
    fontSize: fontSize.xsmall,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.large,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  actionText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  actionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  summaryContainer: {
    padding: spacing.large,
  },
  summaryHeader: {
    flexDirection: 'row',
    gap: spacing.large,
  },
  summaryLeft: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryStars: {
    flexDirection: 'row',
    gap: spacing.xsmall,
    marginVertical: spacing.small,
  },
  totalReviews: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  summaryRight: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xsmall,
  },
  ratingNumber: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    width: 16,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginHorizontal: spacing.small,
    overflow: 'hidden',
  },
  ratingFill: {
    height: '100%',
    backgroundColor: colors.warning,
  },
  ratingCount: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    width: 30,
    textAlign: 'right',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.medium,
    marginTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  viewAllText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
});