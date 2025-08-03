import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, commonStyles } from '../../config/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onPress,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.medium,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = spacing.medium;
        baseStyle.paddingVertical = spacing.small;
        baseStyle.minHeight = 32;
        break;
      case 'large':
        baseStyle.paddingHorizontal = spacing.xlarge;
        baseStyle.paddingVertical = spacing.medium;
        baseStyle.minHeight = 56;
        break;
      default: // medium
        baseStyle.paddingHorizontal = spacing.large;
        baseStyle.paddingVertical = spacing.medium;
        baseStyle.minHeight = 44;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = isDisabled ? colors.gray[300] : colors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = isDisabled ? colors.gray[300] : colors.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = isDisabled ? colors.gray[300] : colors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'danger':
        baseStyle.backgroundColor = isDisabled ? colors.gray[300] : colors.error;
        break;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = fontSize.small;
        break;
      case 'large':
        baseStyle.fontSize = fontSize.large;
        break;
      default: // medium
        baseStyle.fontSize = fontSize.medium;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        baseStyle.color = colors.white;
        break;
      case 'outline':
        baseStyle.color = isDisabled ? colors.gray[400] : colors.primary;
        break;
      case 'ghost':
        baseStyle.color = isDisabled ? colors.gray[400] : colors.primary;
        break;
    }

    return baseStyle;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
        />
      );
    }

    const textElement = <Text style={getTextStyles()}>{title}</Text>;

    if (!icon) {
      return textElement;
    }

    if (iconPosition === 'left') {
      return (
        <>
          {icon}
          <Text style={[getTextStyles(), { marginLeft: spacing.small }]}>{title}</Text>
        </>
      );
    }

    return (
      <>
        <Text style={[getTextStyles(), { marginRight: spacing.small }]}>{title}</Text>
        {icon}
      </>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      onPress={onPress}
      style={[getButtonStyles(), style]}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Preset button components for common use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
);

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="ghost" {...props} />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
);

// Icon button component
export interface IconButtonProps extends Omit<ButtonProps, 'title'> {
  icon: React.ReactNode;
  accessibilityLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'medium',
  variant = 'ghost',
  accessibilityLabel,
  style,
  ...rest
}) => {
  const getIconButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.width = 32;
        baseStyle.height = 32;
        break;
      case 'large':
        baseStyle.width = 56;
        baseStyle.height = 56;
        break;
      default: // medium
        baseStyle.width = 44;
        baseStyle.height = 44;
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = rest.disabled ? colors.gray[300] : colors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = rest.disabled ? colors.gray[300] : colors.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = rest.disabled ? colors.gray[300] : colors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      case 'danger':
        baseStyle.backgroundColor = rest.disabled ? colors.gray[300] : colors.error;
        break;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[getIconButtonStyles(), style]}
      {...rest}
    >
      {rest.loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white}
        />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
};