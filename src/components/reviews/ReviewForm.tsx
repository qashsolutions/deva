import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { ReviewPrompts } from '../../types/review';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string, prompts?: ReviewPrompts) => void;
  onCancel: () => void;
  loading?: boolean;
  showPrompts?: boolean;
  serviceName?: string;
  priestName?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  showPrompts = true,
  serviceName,
  priestName,
}) => {
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState('');
  const [prompts, setPrompts] = useState<ReviewPrompts>({
    punctuality: 0,
    professionalism: 0,
    knowledge: 0,
    communication: 0,
    wouldRecommend: false,
  });

  const handleSubmit = () => {
    if (overallRating === 0) {
      return;
    }

    onSubmit(overallRating, comment, showPrompts ? prompts : undefined);
  };

  const renderStarRating = (
    value: number,
    onChange: (rating: number) => void,
    size: number = 32
  ) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={size}
              color={star <= value ? colors.warning : colors.gray[400]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderOverallRating = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Overall Rating</Text>
      <Text style={styles.sectionSubtitle}>
        How was your experience with {priestName || 'the priest'}?
      </Text>
      {renderStarRating(overallRating, setOverallRating, 40)}
      {overallRating > 0 && (
        <Text style={styles.ratingText}>
          {overallRating === 1 && 'Poor'}
          {overallRating === 2 && 'Fair'}
          {overallRating === 3 && 'Good'}
          {overallRating === 4 && 'Very Good'}
          {overallRating === 5 && 'Excellent'}
        </Text>
      )}
    </Card>
  );

  const renderPrompts = () => {
    if (!showPrompts) return null;

    const promptItems = [
      { key: 'punctuality', label: 'Punctuality', icon: 'time' },
      { key: 'professionalism', label: 'Professionalism', icon: 'business' },
      { key: 'knowledge', label: 'Knowledge', icon: 'school' },
      { key: 'communication', label: 'Communication', icon: 'chatbubbles' },
    ];

    return (
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Rate Specific Aspects</Text>
        <Text style={styles.sectionSubtitle}>Help others by rating these areas</Text>
        
        {promptItems.map((item) => (
          <View key={item.key} style={styles.promptItem}>
            <View style={styles.promptHeader}>
              <Ionicons
                name={item.icon as any}
                size={20}
                color={colors.gray[600]}
              />
              <Text style={styles.promptLabel}>{item.label}</Text>
            </View>
            {renderStarRating(
              prompts[item.key as keyof Omit<ReviewPrompts, 'wouldRecommend'>] as number,
              (rating) => setPrompts({ ...prompts, [item.key]: rating }),
              24
            )}
          </View>
        ))}

        <View style={styles.recommendSection}>
          <Text style={styles.promptLabel}>Would you recommend this priest?</Text>
          <View style={styles.recommendOptions}>
            <TouchableOpacity
              style={[
                styles.recommendButton,
                prompts.wouldRecommend && styles.recommendButtonActive,
              ]}
              onPress={() => setPrompts({ ...prompts, wouldRecommend: true })}
            >
              <Ionicons
                name="thumbs-up"
                size={24}
                color={prompts.wouldRecommend ? colors.white : colors.gray[600]}
              />
              <Text style={[
                styles.recommendText,
                prompts.wouldRecommend && styles.recommendTextActive,
              ]}>
                Yes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.recommendButton,
                prompts.wouldRecommend === false && styles.recommendButtonActive,
              ]}
              onPress={() => setPrompts({ ...prompts, wouldRecommend: false })}
            >
              <Ionicons
                name="thumbs-down"
                size={24}
                color={!prompts.wouldRecommend ? colors.white : colors.gray[600]}
              />
              <Text style={[
                styles.recommendText,
                !prompts.wouldRecommend && styles.recommendTextActive,
              ]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  const renderComment = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Write Your Review</Text>
      <Text style={styles.sectionSubtitle}>
        Share details about your experience
      </Text>
      
      <TextInput
        style={styles.commentInput}
        placeholder="Tell others about your experience with this priest and service..."
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        placeholderTextColor={colors.gray[400]}
      />
      
      <Text style={styles.commentHelper}>
        {comment.length}/500 characters
      </Text>
    </Card>
  );

  const renderSuggestions = () => {
    if (overallRating === 0 || overallRating > 3) return null;

    return (
      <Card style={[styles.section, styles.suggestionsCard]}>
        <View style={styles.suggestionsHeader}>
          <Ionicons name="bulb-outline" size={20} color={colors.info} />
          <Text style={styles.suggestionsTitle}>Help us improve</Text>
        </View>
        <Text style={styles.suggestionsText}>
          What could have made your experience better?
        </Text>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderOverallRating()}
        {renderPrompts()}
        {renderComment()}
        {renderSuggestions()}
        
        <View style={styles.actions}>
          <Button
            title="Submit Review"
            onPress={handleSubmit}
            loading={loading}
            disabled={overallRating === 0 || loading}
            fullWidth
            size="large"
            style={styles.submitButton}
          />
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xlarge,
  },
  section: {
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  sectionSubtitle: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.large,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.small,
  },
  starButton: {
    padding: spacing.xsmall,
  },
  ratingText: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.medium,
  },
  promptItem: {
    marginBottom: spacing.large,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  promptLabel: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  recommendSection: {
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  recommendOptions: {
    flexDirection: 'row',
    gap: spacing.medium,
    marginTop: spacing.medium,
  },
  recommendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  recommendButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  recommendText: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  recommendTextActive: {
    color: colors.white,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    fontSize: fontSize.medium,
    color: colors.text.primary,
    minHeight: 120,
  },
  commentHelper: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.small,
  },
  suggestionsCard: {
    backgroundColor: colors.info + '10',
    borderColor: colors.info + '30',
    borderWidth: 1,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  suggestionsTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.info,
  },
  suggestionsText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    lineHeight: fontSize.medium * 1.4,
  },
  actions: {
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.large,
  },
  submitButton: {
    marginBottom: spacing.medium,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.medium,
  },
  cancelText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
});