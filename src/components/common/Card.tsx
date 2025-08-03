import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

export interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  onPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  margin = 'medium',
  borderRadius: radius = 'medium',
  shadow = true,
  backgroundColor = colors.white,
  borderColor = colors.gray[200],
  onPress,
  containerStyle,
  disabled,
  ...rest
}) => {
  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor,
      overflow: 'hidden',
    };

    // Padding
    switch (padding) {
      case 'small':
        baseStyle.padding = spacing.small;
        break;
      case 'large':
        baseStyle.padding = spacing.large;
        break;
      case 'medium':
        baseStyle.padding = spacing.medium;
        break;
      // 'none' - no padding
    }

    // Margin
    switch (margin) {
      case 'small':
        baseStyle.margin = spacing.small;
        break;
      case 'large':
        baseStyle.margin = spacing.large;
        break;
      case 'medium':
        baseStyle.margin = spacing.medium;
        break;
      // 'none' - no margin
    }

    // Border radius
    switch (radius) {
      case 'small':
        baseStyle.borderRadius = borderRadius.small;
        break;
      case 'large':
        baseStyle.borderRadius = borderRadius.large;
        break;
      case 'medium':
        baseStyle.borderRadius = borderRadius.medium;
        break;
      // 'none' - no border radius
    }

    // Variant styles
    switch (variant) {
      case 'elevated':
        if (shadow) {
          Object.assign(baseStyle, shadows.medium);
        }
        break;
      case 'outlined':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = borderColor;
        break;
      case 'filled':
        baseStyle.backgroundColor = colors.gray[50];
        break;
    }

    return baseStyle;
  };

  const content = <View style={[getCardStyles(), containerStyle]}>{children}</View>;

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={disabled}
        {...rest}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Section card with header
export interface SectionCardProps extends CardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  headerStyle?: ViewStyle;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  headerAction,
  headerStyle,
  children,
  padding = 'none',
  ...rest
}) => {
  return (
    <Card padding={padding} {...rest}>
      {(title || subtitle || headerAction) && (
        <View style={[styles.sectionHeader, headerStyle]}>
          <View style={styles.sectionTitleContainer}>
            {title && <Text style={styles.sectionTitle}>{title}</Text>}
            {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
          </View>
          {headerAction}
        </View>
      )}
      <View style={{ padding: spacing.medium }}>{children}</View>
    </Card>
  );
};

// Pressable card with hover effects
export interface PressableCardProps extends CardProps {
  pressedOpacity?: number;
  pressedScale?: number;
}

export const PressableCard: React.FC<PressableCardProps> = ({
  pressedOpacity = 0.95,
  pressedScale = 0.98,
  onPress,
  children,
  ...rest
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: pressedScale,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: pressedOpacity,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...rest}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
        }}
      >
        <Card {...rest} onPress={undefined}>
          {children}
        </Card>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Horizontal card for lists
export interface HorizontalCardProps extends CardProps {
  imageSource?: { uri: string } | number;
  imageStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const HorizontalCard: React.FC<HorizontalCardProps> = ({
  imageSource,
  imageStyle,
  contentContainerStyle,
  children,
  ...rest
}) => {
  return (
    <Card {...rest}>
      <View style={styles.horizontalContainer}>
        {imageSource && (
          <Image
            source={imageSource}
            style={[styles.horizontalImage, imageStyle]}
            resizeMode="cover"
          />
        )}
        <View style={[styles.horizontalContent, contentContainerStyle]}>
          {children}
        </View>
      </View>
    </Card>
  );
};

import { Text, Image, Animated } from 'react-native';

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.medium,
    marginRight: spacing.medium,
  },
  horizontalContent: {
    flex: 1,
  },
});