import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, fontSize } from '../../config/theme';

export type AvatarSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

export interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: AvatarSize;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'bottom-right';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  verified?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  onPress,
  backgroundColor = colors.primary,
  textColor = colors.white,
  borderColor,
  borderWidth = 0,
  badge,
  badgePosition = 'bottom-right',
  style,
  imageStyle,
  showOnlineStatus = false,
  isOnline = false,
  verified = false,
}) => {
  const getDimensions = (): number => {
    switch (size) {
      case 'xsmall':
        return 32;
      case 'small':
        return 40;
      case 'large':
        return 64;
      case 'xlarge':
        return 80;
      default: // medium
        return 48;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'xsmall':
        return fontSize.xsmall;
      case 'small':
        return fontSize.small;
      case 'large':
        return fontSize.xlarge;
      case 'xlarge':
        return fontSize.xxlarge;
      default: // medium
        return fontSize.medium;
    }
  };

  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const dimensions = getDimensions();
  const avatarStyle: ViewStyle = {
    width: dimensions,
    height: dimensions,
    borderRadius: dimensions / 2,
    backgroundColor: source ? colors.gray[200] : backgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth,
    borderColor: borderColor || colors.transparent,
  };

  const renderAvatar = () => {
    if (source) {
      return (
        <Image
          source={source}
          style={[
            {
              width: dimensions,
              height: dimensions,
              borderRadius: dimensions / 2,
            },
            imageStyle,
          ]}
          resizeMode="cover"
        />
      );
    }

    if (name) {
      return (
        <Text
          style={{
            fontSize: getFontSize(),
            fontWeight: '600',
            color: textColor,
          }}
        >
          {getInitials(name)}
        </Text>
      );
    }

    return (
      <Ionicons
        name="person"
        size={dimensions * 0.6}
        color={textColor}
      />
    );
  };

  const renderBadge = () => {
    if (verified) {
      return (
        <View style={[styles.badge, getBadgePosition(), styles.verifiedBadge]}>
          <Ionicons name="checkmark" size={12} color={colors.white} />
        </View>
      );
    }

    if (showOnlineStatus) {
      return (
        <View
          style={[
            styles.badge,
            getBadgePosition(),
            styles.onlineStatusBadge,
            { backgroundColor: isOnline ? colors.success : colors.gray[400] },
          ]}
        />
      );
    }

    if (badge) {
      return (
        <View style={[styles.badge, getBadgePosition()]}>
          {badge}
        </View>
      );
    }

    return null;
  };

  const getBadgePosition = (): ViewStyle => {
    const badgeSize = dimensions * 0.3;
    const offset = dimensions * 0.05;

    if (badgePosition === 'top-right') {
      return {
        top: offset,
        right: offset,
        width: badgeSize,
        height: badgeSize,
      };
    }

    return {
      bottom: offset,
      right: offset,
      width: badgeSize,
      height: badgeSize,
    };
  };

  const content = (
    <View style={[avatarStyle, style]}>
      {renderAvatar()}
      {renderBadge()}
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

// Avatar group component
export interface AvatarGroupProps {
  avatars: Array<{ source?: { uri: string }; name?: string }>;
  size?: AvatarSize;
  max?: number;
  spacing?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  size = 'small',
  max = 3,
  spacing = -8,
  onPress,
  style,
}) => {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <TouchableOpacity
      style={[styles.avatarGroup, style]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : spacing,
            zIndex: displayAvatars.length - index,
          }}
        >
          <Avatar
            source={avatar.source}
            name={avatar.name}
            size={size}
            borderWidth={2}
            borderColor={colors.white}
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={{
            marginLeft: spacing,
            zIndex: 0,
          }}
        >
          <Avatar
            name={`+${remainingCount}`}
            size={size}
            backgroundColor={colors.gray[300]}
            borderWidth={2}
            borderColor={colors.white}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

// User avatar with name
export interface UserAvatarProps extends AvatarProps {
  title: string;
  subtitle?: string;
  titleStyle?: ViewStyle;
  subtitleStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  onPress?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  title,
  subtitle,
  titleStyle,
  subtitleStyle,
  containerStyle,
  onPress,
  ...avatarProps
}) => {
  const content = (
    <View style={[styles.userAvatarContainer, containerStyle]}>
      <Avatar {...avatarProps} onPress={undefined} />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.userSubtitle, subtitleStyle]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
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

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.white,
  },
  verifiedBadge: {
    backgroundColor: colors.info,
  },
  onlineStatusBadge: {
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  userSubtitle: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: 2,
  },
});