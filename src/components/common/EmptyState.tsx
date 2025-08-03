import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, commonStyles } from '../../config/theme';
import { Button, ButtonProps } from './Button';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;
  image?: ImageSourcePropType;
  imageStyle?: ViewStyle;
  action?: {
    label: string;
    onPress: () => void;
    buttonProps?: Partial<ButtonProps>;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
    buttonProps?: Partial<ButtonProps>;
  };
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  iconColor = colors.gray[400],
  iconSize = 80,
  image,
  imageStyle,
  action,
  secondaryAction,
  style,
  titleStyle,
  messageStyle,
}) => {
  const renderVisual = () => {
    if (image) {
      return (
        <Image
          source={image}
          style={[styles.image, imageStyle]}
          resizeMode="contain"
        />
      );
    }

    if (icon) {
      return (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={iconSize} color={iconColor} />
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, style]}>
      {renderVisual()}
      
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      
      {message && (
        <Text style={[styles.message, messageStyle]}>{message}</Text>
      )}
      
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="primary"
          style={styles.primaryButton}
          {...action.buttonProps}
        />
      )}
      
      {secondaryAction && (
        <Button
          title={secondaryAction.label}
          onPress={secondaryAction.onPress}
          variant="ghost"
          style={styles.secondaryButton}
          {...secondaryAction.buttonProps}
        />
      )}
    </View>
  );
};

// Preset empty states for common scenarios
export const NoDataEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="file-tray-outline"
    title="No Data Available"
    message="We couldn't find any data to display here."
    {...props}
  />
);

export const NoResultsEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="search-outline"
    title="No Results Found"
    message="Try adjusting your search or filters to find what you're looking for."
    {...props}
  />
);

export const ErrorEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="alert-circle-outline"
    iconColor={colors.error}
    title="Something Went Wrong"
    message="An error occurred while loading this content. Please try again."
    action={{
      label: 'Retry',
      onPress: () => {},
    }}
    {...props}
  />
);

export const NoConnectionEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="wifi-outline"
    iconColor={colors.warning}
    title="No Internet Connection"
    message="Please check your connection and try again."
    action={{
      label: 'Retry',
      onPress: () => {},
    }}
    {...props}
  />
);

export const NoBookingsEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="calendar-outline"
    title="No Bookings Yet"
    message="You haven't made any bookings. Start by searching for a priest."
    action={{
      label: 'Find Priests',
      onPress: () => {},
    }}
    {...props}
  />
);

export const NoServicesEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="list-outline"
    title="No Services Added"
    message="Add your first service to start receiving bookings."
    action={{
      label: 'Add Service',
      onPress: () => {},
    }}
    {...props}
  />
);

export const NoMessagesEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="chatbubbles-outline"
    title="No Messages"
    message="Messages with priests will appear here."
    {...props}
  />
);

export const NoNotificationsEmptyState: React.FC<Partial<EmptyStateProps>> = (props) => (
  <EmptyState
    icon="notifications-outline"
    title="No Notifications"
    message="You're all caught up! Check back later for updates."
    {...props}
  />
);

// Loading state component (similar to empty state)
export interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  style,
  textStyle,
}) => (
  <View style={[styles.container, style]}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={[styles.loadingText, textStyle]}>{message}</Text>
  </View>
);

import { ActivityIndicator } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xlarge,
  },
  iconContainer: {
    marginBottom: spacing.large,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: spacing.large,
  },
  title: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  message: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xlarge,
    lineHeight: fontSize.medium * 1.5,
  },
  primaryButton: {
    marginBottom: spacing.medium,
    minWidth: 200,
  },
  secondaryButton: {
    minWidth: 200,
  },
  loadingText: {
    marginTop: spacing.medium,
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
});