import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../config/theme';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  onRemove?: () => void;
  outlined?: boolean;
  rounded?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  onPress,
  onRemove,
  outlined = false,
  rounded = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getBackgroundColor = (): string => {
    if (outlined) return colors.transparent;

    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
      case 'neutral':
        return colors.gray[200];
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (outlined) {
      switch (variant) {
        case 'primary':
          return colors.primary;
        case 'secondary':
          return colors.secondary;
        case 'success':
          return colors.success;
        case 'warning':
          return colors.warning;
        case 'error':
          return colors.error;
        case 'info':
          return colors.info;
        case 'neutral':
          return colors.gray[700];
        default:
          return colors.primary;
      }
    }

    return variant === 'neutral' ? colors.gray[700] : colors.white;
  };

  const getBorderColor = (): string => {
    if (!outlined) return colors.transparent;

    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.info;
      case 'neutral':
        return colors.gray[400];
      default:
        return colors.primary;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: spacing.small,
          paddingVertical: spacing.xsmall,
          fontSize: fontSize.xsmall,
          iconSize: 12,
          height: 24,
        };
      case 'large':
        return {
          paddingHorizontal: spacing.large,
          paddingVertical: spacing.small,
          fontSize: fontSize.medium,
          iconSize: 18,
          height: 36,
        };
      default: // medium
        return {
          paddingHorizontal: spacing.medium,
          paddingVertical: spacing.xsmall + 2,
          fontSize: fontSize.small,
          iconSize: 14,
          height: 28,
        };
    }
  };

  const sizeStyles = getSize();
  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();
  const borderColor = getBorderColor();

  const badgeStyles: ViewStyle = {
    backgroundColor,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    borderRadius: rounded ? sizeStyles.height / 2 : borderRadius.small,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    justifyContent: 'center',
    minHeight: sizeStyles.height,
    borderWidth: outlined ? 1 : 0,
    borderColor,
  };

  const labelStyles: TextStyle = {
    fontSize: sizeStyles.fontSize,
    fontWeight: '500',
    color: textColor,
  };

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <Ionicons
        name={icon}
        size={sizeStyles.iconSize}
        color={textColor}
        style={
          iconPosition === 'left'
            ? { marginRight: spacing.xsmall }
            : { marginLeft: spacing.xsmall }
        }
      />
    );
  };

  const renderRemoveButton = () => {
    if (!onRemove) return null;

    return (
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ marginLeft: spacing.xsmall }}
      >
        <Ionicons
          name="close-circle"
          size={sizeStyles.iconSize}
          color={textColor}
        />
      </TouchableOpacity>
    );
  };

  const content = (
    <>
      {icon && iconPosition === 'left' && renderIcon()}
      <Text style={[labelStyles, textStyle]}>{label}</Text>
      {icon && iconPosition === 'right' && renderIcon()}
      {renderRemoveButton()}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[badgeStyles, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[badgeStyles, style]}>{content}</View>;
};

// Status badge component
export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'error';
  label?: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
  style,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          variant: 'success' as BadgeVariant,
          icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
          label: label || 'Active',
        };
      case 'inactive':
        return {
          variant: 'neutral' as BadgeVariant,
          icon: 'remove-circle' as keyof typeof Ionicons.glyphMap,
          label: label || 'Inactive',
        };
      case 'pending':
        return {
          variant: 'warning' as BadgeVariant,
          icon: 'time' as keyof typeof Ionicons.glyphMap,
          label: label || 'Pending',
        };
      case 'completed':
        return {
          variant: 'success' as BadgeVariant,
          icon: 'checkmark-done' as keyof typeof Ionicons.glyphMap,
          label: label || 'Completed',
        };
      case 'cancelled':
        return {
          variant: 'error' as BadgeVariant,
          icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
          label: label || 'Cancelled',
        };
      case 'error':
        return {
          variant: 'error' as BadgeVariant,
          icon: 'alert-circle' as keyof typeof Ionicons.glyphMap,
          label: label || 'Error',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      label={config.label}
      variant={config.variant}
      icon={config.icon}
      size={size}
      style={style}
    />
  );
};

// Number badge component (for notifications, counts, etc.)
export interface NumberBadgeProps {
  count: number;
  max?: number;
  size?: BadgeSize;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const NumberBadge: React.FC<NumberBadgeProps> = ({
  count,
  max = 99,
  size = 'small',
  variant = 'error',
  style,
}) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      label={displayCount}
      variant={variant}
      size={size}
      rounded
      style={[{ minWidth: 20 }, style]}
    />
  );
};

// Tag group component
export interface TagGroupProps {
  tags: string[];
  onTagPress?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  variant?: BadgeVariant;
  size?: BadgeSize;
  maxTags?: number;
  style?: ViewStyle;
  tagStyle?: ViewStyle;
}

export const TagGroup: React.FC<TagGroupProps> = ({
  tags,
  onTagPress,
  onTagRemove,
  variant = 'neutral',
  size = 'small',
  maxTags,
  style,
  tagStyle,
}) => {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

  return (
    <View style={[styles.tagGroup, style]}>
      {displayTags.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          label={tag}
          variant={variant}
          size={size}
          onPress={onTagPress ? () => onTagPress(tag) : undefined}
          onRemove={onTagRemove ? () => onTagRemove(tag) : undefined}
          outlined
          style={[styles.tag, tagStyle]}
        />
      ))}
      {remainingCount > 0 && (
        <Badge
          label={`+${remainingCount}`}
          variant="neutral"
          size={size}
          style={[styles.tag, tagStyle]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -spacing.xsmall,
    marginRight: -spacing.xsmall,
  },
  tag: {
    marginTop: spacing.xsmall,
    marginRight: spacing.xsmall,
  },
});