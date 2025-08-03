import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../../config/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  inputStyle?: TextStyle;
  containerStyle?: ViewStyle;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      required = false,
      disabled = false,
      fullWidth = true,
      leftIcon,
      rightIcon,
      onRightIconPress,
      inputStyle,
      containerStyle,
      variant = 'outlined',
      size = 'medium',
      style,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const getContainerStyles = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        marginVertical: spacing.small,
      };

      if (fullWidth) {
        baseStyle.width = '100%';
      }

      return baseStyle;
    };

    const getInputContainerStyles = (): ViewStyle => {
      const baseStyle: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.medium,
        overflow: 'hidden',
      };

      // Size styles
      switch (size) {
        case 'small':
          baseStyle.minHeight = 40;
          break;
        case 'large':
          baseStyle.minHeight = 56;
          break;
        default: // medium
          baseStyle.minHeight = 48;
      }

      // Variant styles
      if (variant === 'outlined') {
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = error
          ? colors.error
          : isFocused
          ? colors.primary
          : colors.gray[300];
        baseStyle.backgroundColor = disabled ? colors.gray[50] : colors.white;
      } else {
        // filled
        baseStyle.backgroundColor = disabled
          ? colors.gray[100]
          : error
          ? colors.error + '10'
          : colors.gray[100];
        if (isFocused) {
          baseStyle.borderWidth = 2;
          baseStyle.borderColor = error ? colors.error : colors.primary;
        }
      }

      return baseStyle;
    };

    const getInputStyles = (): TextStyle => {
      const baseStyle: TextStyle = {
        flex: 1,
        color: disabled ? colors.gray[400] : colors.text.primary,
      };

      // Size styles
      switch (size) {
        case 'small':
          baseStyle.fontSize = fontSize.small;
          baseStyle.paddingHorizontal = spacing.medium;
          baseStyle.paddingVertical = spacing.small;
          break;
        case 'large':
          baseStyle.fontSize = fontSize.large;
          baseStyle.paddingHorizontal = spacing.large;
          baseStyle.paddingVertical = spacing.medium;
          break;
        default: // medium
          baseStyle.fontSize = fontSize.medium;
          baseStyle.paddingHorizontal = spacing.medium;
          baseStyle.paddingVertical = spacing.small;
      }

      if (leftIcon) {
        baseStyle.paddingLeft = 0;
      }

      return baseStyle;
    };

    const getLabelStyles = (): TextStyle => {
      return {
        fontSize: fontSize.small,
        fontWeight: '500',
        color: error ? colors.error : colors.text.secondary,
        marginBottom: spacing.xsmall,
      };
    };

    const getHintStyles = (): TextStyle => {
      return {
        fontSize: fontSize.xsmall,
        color: error ? colors.error : colors.text.secondary,
        marginTop: spacing.xsmall,
      };
    };

    const getIconSize = () => {
      switch (size) {
        case 'small':
          return 18;
        case 'large':
          return 24;
        default:
          return 20;
      }
    };

    return (
      <View style={[getContainerStyles(), containerStyle]}>
        {label && (
          <Text style={getLabelStyles()}>
            {label}
            {required && <Text style={{ color: colors.error }}> *</Text>}
          </Text>
        )}

        <View style={getInputContainerStyles()}>
          {leftIcon && (
            <View style={{ paddingLeft: spacing.medium }}>
              <Ionicons
                name={leftIcon}
                size={getIconSize()}
                color={disabled ? colors.gray[400] : colors.gray[600]}
              />
            </View>
          )}

          <TextInput
            ref={ref}
            style={[getInputStyles(), inputStyle]}
            placeholderTextColor={colors.gray[400]}
            editable={!disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
          />

          {rightIcon && (
            <TouchableOpacity
              onPress={onRightIconPress}
              disabled={!onRightIconPress || disabled}
              style={{ paddingRight: spacing.medium }}
            >
              <Ionicons
                name={rightIcon}
                size={getIconSize()}
                color={disabled ? colors.gray[400] : colors.gray[600]}
              />
            </TouchableOpacity>
          )}
        </View>

        {(error || hint) && <Text style={getHintStyles()}>{error || hint}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

// Specialized input components
export const EmailInput: React.FC<Omit<InputProps, 'keyboardType' | 'autoCapitalize'>> = (
  props
) => (
  <Input
    keyboardType="email-address"
    autoCapitalize="none"
    autoComplete="email"
    leftIcon="mail-outline"
    {...props}
  />
);

export const PasswordInput: React.FC<Omit<InputProps, 'secureTextEntry'>> = (props) => {
  const [isSecure, setIsSecure] = useState(true);

  return (
    <Input
      secureTextEntry={isSecure}
      leftIcon="lock-closed-outline"
      rightIcon={isSecure ? 'eye-outline' : 'eye-off-outline'}
      onRightIconPress={() => setIsSecure(!isSecure)}
      autoCapitalize="none"
      autoComplete="password"
      {...props}
    />
  );
};

export const PhoneInput: React.FC<Omit<InputProps, 'keyboardType'>> = (props) => (
  <Input
    keyboardType="phone-pad"
    leftIcon="call-outline"
    autoComplete="tel"
    {...props}
  />
);

export const SearchInput: React.FC<InputProps> = (props) => (
  <Input
    leftIcon="search-outline"
    placeholder="Search..."
    returnKeyType="search"
    {...props}
  />
);

export const NumberInput: React.FC<Omit<InputProps, 'keyboardType'>> = (props) => (
  <Input keyboardType="numeric" {...props} />
);

// Textarea component for multiline input
export interface TextAreaProps extends Omit<InputProps, 'multiline'> {
  numberOfLines?: number;
  maxLength?: number;
  showCounter?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  numberOfLines = 4,
  maxLength,
  showCounter = true,
  value = '',
  onChangeText,
  ...rest
}) => {
  const currentLength = value.toString().length;

  return (
    <View>
      <Input
        multiline
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        value={value}
        onChangeText={onChangeText}
        textAlignVertical="top"
        inputStyle={{
          minHeight: numberOfLines * 24,
          paddingTop: spacing.medium,
        }}
        {...rest}
      />
      {showCounter && maxLength && (
        <Text
          style={{
            fontSize: fontSize.xsmall,
            color: colors.text.secondary,
            textAlign: 'right',
            marginTop: -spacing.xsmall,
            marginRight: spacing.small,
          }}
        >
          {currentLength}/{maxLength}
        </Text>
      )}
    </View>
  );
};