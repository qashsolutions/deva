import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  Modal,
} from 'react-native';
import { colors, spacing, fontSize, commonStyles } from '../../config/theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  fullScreen?: boolean;
  backgroundColor?: string;
  containerStyle?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = colors.primary,
  text,
  overlay = false,
  fullScreen = false,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  containerStyle,
}) => {
  const renderSpinner = () => (
    <View style={[styles.spinnerContainer, containerStyle]}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={[styles.text, { color: overlay || fullScreen ? colors.white : colors.text.primary }]}>
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent visible animationType="fade">
        <View style={[styles.fullScreenContainer, { backgroundColor }]}>
          {renderSpinner()}
        </View>
      </Modal>
    );
  }

  if (overlay) {
    return (
      <View style={[styles.overlayContainer, { backgroundColor }]}>
        {renderSpinner()}
      </View>
    );
  }

  return renderSpinner();
};

// Page loading component
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <View style={styles.pageLoaderContainer}>
    <LoadingSpinner text={text} />
  </View>
);

// Inline loading component
export const InlineLoader: React.FC<{ text?: string; color?: string }> = ({
  text,
  color = colors.text.secondary,
}) => (
  <View style={styles.inlineContainer}>
    <ActivityIndicator size="small" color={color} />
    {text && <Text style={[styles.inlineText, { color }]}>{text}</Text>}
  </View>
);

// Skeleton loader component for content placeholders
export interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const [opacity] = React.useState(new Animated.Value(0.3));

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.gray[200],
          opacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton content loader for lists
export interface SkeletonContentProps {
  lines?: number;
  showAvatar?: boolean;
  avatarSize?: number;
  lineHeight?: number;
  spacing?: number;
}

export const SkeletonContent: React.FC<SkeletonContentProps> = ({
  lines = 3,
  showAvatar = false,
  avatarSize = 40,
  lineHeight = 16,
  spacing: lineSpacing = 8,
}) => {
  return (
    <View style={styles.skeletonContentContainer}>
      {showAvatar && (
        <SkeletonLoader
          width={avatarSize}
          height={avatarSize}
          borderRadius={avatarSize / 2}
          style={{ marginRight: spacing.medium }}
        />
      )}
      <View style={{ flex: 1 }}>
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonLoader
            key={index}
            width={index === lines - 1 ? '70%' : '100%'}
            height={lineHeight}
            style={{ marginBottom: index < lines - 1 ? lineSpacing : 0 }}
          />
        ))}
      </View>
    </View>
  );
};

// Import Animated from react-native
import { Animated } from 'react-native';

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
  },
  text: {
    marginTop: spacing.medium,
    fontSize: fontSize.medium,
    textAlign: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  pageLoaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.small,
  },
  inlineText: {
    marginLeft: spacing.small,
    fontSize: fontSize.small,
  },
  skeletonContentContainer: {
    flexDirection: 'row',
    padding: spacing.medium,
  },
});

// Export a default loading screen component
export const LoadingScreen: React.FC<{ message?: string }> = ({ 
  message = 'Please wait...' 
}) => (
  <LoadingSpinner fullScreen text={message} />
);