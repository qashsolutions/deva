import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../../config/theme';

export interface RatingProps {
  value: number;
  maxValue?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  emptyColor?: string;
  readonly?: boolean;
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  onChange?: (rating: number) => void;
  style?: ViewStyle;
  starStyle?: ViewStyle;
  textStyle?: TextStyle;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  maxValue = 5,
  size = 'medium',
  color = colors.warning,
  emptyColor = colors.gray[300],
  readonly = true,
  showValue = false,
  showCount = false,
  count,
  onChange,
  style,
  starStyle,
  textStyle,
}) => {
  const [tempRating, setTempRating] = useState(0);

  const getStarSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const handlePress = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const renderStar = (index: number) => {
    const filled = index < (tempRating || value);
    const starSize = getStarSize();

    return (
      <TouchableOpacity
        key={index}
        disabled={readonly}
        onPress={() => handlePress(index + 1)}
        onPressIn={() => !readonly && setTempRating(index + 1)}
        onPressOut={() => !readonly && setTempRating(0)}
        activeOpacity={readonly ? 1 : 0.7}
        style={[{ padding: spacing.xsmall }, starStyle]}
      >
        <Ionicons
          name={filled ? 'star' : 'star-outline'}
          size={starSize}
          color={filled ? color : emptyColor}
        />
      </TouchableOpacity>
    );
  };

  const renderValue = () => {
    if (!showValue && !showCount) return null;

    const textSize = size === 'small' ? fontSize.small : fontSize.medium;

    return (
      <View style={styles.textContainer}>
        {showValue && (
          <Text style={[styles.valueText, { fontSize: textSize }, textStyle]}>
            {value.toFixed(1)}
          </Text>
        )}
        {showCount && count !== undefined && (
          <Text style={[styles.countText, { fontSize: textSize }, textStyle]}>
            ({count})
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxValue }, (_, i) => renderStar(i))}
      </View>
      {renderValue()}
    </View>
  );
};

// Compact rating display component
export interface CompactRatingProps {
  value: number;
  count?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  showCount?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

export const CompactRating: React.FC<CompactRatingProps> = ({
  value,
  count,
  size = 'medium',
  color = colors.warning,
  showCount = true,
  style,
  textStyle,
  onPress,
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 20;
      default:
        return 16;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return fontSize.xsmall;
      case 'large':
        return fontSize.medium;
      default:
        return fontSize.small;
    }
  };

  const content = (
    <View style={[styles.compactContainer, style]}>
      <Ionicons name="star" size={getIconSize()} color={color} />
      <Text
        style={[
          styles.compactValue,
          { fontSize: getTextSize(), marginLeft: spacing.xsmall },
          textStyle,
        ]}
      >
        {value.toFixed(1)}
      </Text>
      {showCount && count !== undefined && (
        <Text
          style={[
            styles.compactCount,
            { fontSize: getTextSize() },
            textStyle,
          ]}
        >
          ({count})
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Rating input with labels
export interface RatingInputProps extends Omit<RatingProps, 'readonly'> {
  label?: string;
  error?: string;
  required?: boolean;
  labels?: string[];
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  label,
  error,
  required = false,
  labels,
  value,
  onChange,
  containerStyle,
  labelStyle,
  ...ratingProps
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const getLabel = () => {
    if (labels && labels.length > 0) {
      const index = (hoveredRating || value) - 1;
      return labels[index] || '';
    }
    return '';
  };

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <Text style={[styles.inputLabel, labelStyle]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      
      <Rating
        value={value}
        onChange={onChange}
        readonly={false}
        {...ratingProps}
      />
      
      {labels && (
        <Text style={styles.ratingLabel}>
          {getLabel()}
        </Text>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

// Rating statistics component
export interface RatingStatsProps {
  averageRating: number;
  totalCount: number;
  distribution: { [key: number]: number };
  style?: ViewStyle;
  onPressBar?: (rating: number) => void;
}

export const RatingStats: React.FC<RatingStatsProps> = ({
  averageRating,
  totalCount,
  distribution,
  style,
  onPressBar,
}) => {
  const maxCount = Math.max(...Object.values(distribution));

  const renderBar = (rating: number) => {
    const count = distribution[rating] || 0;
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

    return (
      <TouchableOpacity
        key={rating}
        style={styles.barContainer}
        onPress={() => onPressBar?.(rating)}
        disabled={!onPressBar}
        activeOpacity={onPressBar ? 0.7 : 1}
      >
        <Text style={styles.barLabel}>{rating}</Text>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>
        <Text style={styles.barCount}>{count}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.statsContainer, style]}>
      <View style={styles.statsHeader}>
        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
        <Rating value={averageRating} size="small" readonly />
        <Text style={styles.totalCount}>{totalCount} reviews</Text>
      </View>
      
      <View style={styles.barsContainer}>
        {[5, 4, 3, 2, 1].map(rating => renderBar(rating))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.small,
  },
  valueText: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  countText: {
    color: colors.text.secondary,
    marginLeft: spacing.xsmall,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
    borderRadius: 4,
  },
  compactValue: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  compactCount: {
    color: colors.text.secondary,
    marginLeft: spacing.xsmall,
  },
  inputContainer: {
    marginVertical: spacing.small,
  },
  inputLabel: {
    fontSize: fontSize.small,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  ratingLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xsmall,
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSize.xsmall,
    color: colors.error,
    marginTop: spacing.xsmall,
  },
  statsContainer: {
    padding: spacing.medium,
  },
  statsHeader: {
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  averageRating: {
    fontSize: fontSize.xxxlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  totalCount: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.small,
  },
  barsContainer: {
    marginTop: spacing.medium,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  barLabel: {
    width: 20,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'right',
    marginRight: spacing.small,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  barCount: {
    width: 40,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'right',
    marginLeft: spacing.small,
  },
});