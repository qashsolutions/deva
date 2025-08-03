import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { Rating } from '../common/Rating';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { PriestRecommendation } from '../../types/ai';
import { formatPrice } from '../../utils/formatters';

interface PriestRecommendationsProps {
  recommendations: PriestRecommendation[];
  loading?: boolean;
  onSelectPriest: (priestId: string) => void;
  onRefresh?: () => void;
}

export const PriestRecommendations: React.FC<PriestRecommendationsProps> = ({
  recommendations,
  loading,
  onSelectPriest,
  onRefresh,
}) => {
  const renderRecommendation = ({ item }: { item: PriestRecommendation }) => {
    const { priest, matchScore, reasoning, strengths, considerations, travelDistance } = item;
    
    return (
      <TouchableOpacity onPress={() => onSelectPriest(priest.id)}>
        <Card style={styles.recommendationCard}>
          {/* Match Score Badge */}
          <View style={styles.matchBadge}>
            <Text style={styles.matchScore}>{matchScore}%</Text>
            <Text style={styles.matchLabel}>Match</Text>
          </View>

          {/* Priest Info */}
          <View style={styles.priestHeader}>
            <Avatar
              name={priest.name}
              size="medium"
              imageUrl={priest.profilePhotoUrl}
            />
            <View style={styles.priestInfo}>
              <Text style={styles.priestName}>{priest.name}</Text>
              <View style={styles.metaRow}>
                <Rating value={priest.priestProfile?.rating || 0} size="small" />
                <Text style={styles.reviewCount}>
                  ({priest.priestProfile?.reviewCount || 0})
                </Text>
                {travelDistance && (
                  <>
                    <Text style={styles.separator}>•</Text>
                    <Ionicons name="location" size={14} color={colors.gray[600]} />
                    <Text style={styles.distance}>{travelDistance.toFixed(1)} mi</Text>
                  </>
                )}
              </View>
              <View style={styles.languages}>
                {priest.languages.slice(0, 3).map((lang, index) => (
                  <Badge
                    key={index}
                    text={lang}
                    variant="secondary"
                    size="small"
                    style={styles.languageBadge}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* AI Reasoning */}
          <View style={styles.aiInsight}>
            <View style={styles.insightHeader}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.insightTitle}>Why this match?</Text>
            </View>
            <Text style={styles.reasoning}>{reasoning}</Text>
          </View>

          {/* Strengths */}
          {strengths.length > 0 && (
            <View style={styles.strengthsSection}>
              {strengths.map((strength, index) => (
                <View key={index} style={styles.strengthItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.strengthText}>{strength}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Considerations */}
          {considerations.length > 0 && (
            <View style={styles.considerationsSection}>
              <Text style={styles.considerationTitle}>Things to consider:</Text>
              {considerations.map((consideration, index) => (
                <View key={index} style={styles.considerationItem}>
                  <Ionicons name="information-circle" size={16} color={colors.warning} />
                  <Text style={styles.considerationText}>{consideration}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Availability & Price */}
          <View style={styles.footer}>
            <View style={styles.availability}>
              <Ionicons name="calendar-outline" size={16} color={colors.gray[600]} />
              <Text style={styles.availabilityText}>
                {item.availability.hasRequestedSlot ? 'Available' : 'Check availability'}
              </Text>
            </View>
            {item.estimatedPrice && (
              <Text style={styles.price}>
                From {formatPrice(item.estimatedPrice)}
              </Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding the best priests for you...</Text>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={48} color={colors.gray[400]} />
        <Text style={styles.emptyTitle}>No matches found</Text>
        <Text style={styles.emptyText}>
          Try adjusting your search criteria or expanding your location range
        </Text>
        {onRefresh && (
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Search Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={recommendations}
      renderItem={renderRecommendation}
      keyExtractor={(item) => item.priest.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: spacing.small,
  },
  recommendationCard: {
    padding: spacing.medium,
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: spacing.medium,
    right: spacing.medium,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
    alignItems: 'center',
  },
  matchScore: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.white,
  },
  matchLabel: {
    fontSize: fontSize.xsmall,
    color: colors.white,
    textTransform: 'uppercase',
  },
  priestHeader: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  priestInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  priestName: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  reviewCount: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.xsmall,
  },
  separator: {
    marginHorizontal: spacing.small,
    color: colors.gray[400],
  },
  distance: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.xsmall,
  },
  languages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xsmall,
  },
  languageBadge: {
    marginRight: spacing.xsmall,
  },
  aiInsight: {
    backgroundColor: colors.primary + '10',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  insightTitle: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xsmall,
  },
  reasoning: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.4,
  },
  strengthsSection: {
    marginBottom: spacing.medium,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xsmall,
  },
  strengthText: {
    fontSize: fontSize.small,
    color: colors.text.primary,
    marginLeft: spacing.small,
    flex: 1,
  },
  considerationsSection: {
    backgroundColor: colors.warning + '10',
    padding: spacing.small,
    borderRadius: borderRadius.small,
    marginBottom: spacing.medium,
  },
  considerationTitle: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: spacing.xsmall,
  },
  considerationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xsmall,
  },
  considerationText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.small,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  availability: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.xsmall,
  },
  price: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xlarge * 2,
  },
  loadingText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginTop: spacing.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xlarge * 2,
    paddingHorizontal: spacing.large,
  },
  emptyTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.medium,
  },
  emptyText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.small,
  },
  retryButton: {
    marginTop: spacing.large,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
  },
  retryText: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.white,
  },
});