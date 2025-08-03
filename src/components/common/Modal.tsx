import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize, commonStyles } from '../../config/theme';
import { Button, ButtonProps } from './Button';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  position?: 'center' | 'bottom';
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  scrollable?: boolean;
  footer?: React.ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'center',
  showCloseButton = true,
  closeOnBackdropPress = true,
  scrollable = true,
  footer,
  containerStyle,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();

  const getModalHeight = () => {
    switch (size) {
      case 'small':
        return SCREEN_HEIGHT * 0.3;
      case 'medium':
        return SCREEN_HEIGHT * 0.6;
      case 'large':
        return SCREEN_HEIGHT * 0.8;
      case 'full':
        return SCREEN_HEIGHT - insets.top;
      default:
        return SCREEN_HEIGHT * 0.6;
    }
  };

  const getModalStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.white,
      maxHeight: getModalHeight(),
      width: '90%',
      maxWidth: 400,
    };

    if (position === 'center') {
      baseStyle.borderRadius = borderRadius.large;
    } else {
      baseStyle.borderTopLeftRadius = borderRadius.xlarge;
      baseStyle.borderTopRightRadius = borderRadius.xlarge;
      baseStyle.width = '100%';
      baseStyle.maxWidth = '100%';
    }

    return baseStyle;
  };

  const renderContent = () => (
    <View style={[getModalStyles(), containerStyle]}>
      {/* Header */}
      {(title || showCloseButton) && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {showCloseButton && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      {scrollable ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, contentStyle]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.contentContainer, contentStyle]}>
          {children}
        </View>
      )}

      {/* Footer */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={position === 'bottom' ? 'slide' : 'fade'}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback
        onPress={closeOnBackdropPress ? onClose : undefined}
        disabled={!closeOnBackdropPress}
      >
        <View
          style={[
            styles.backdrop,
            position === 'bottom' && styles.backdropBottom,
          ]}
        >
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={position === 'center' ? styles.centerContainer : styles.bottomContainer}
            >
              {renderContent()}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

// Confirmation modal component
export interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonProps?: Partial<ButtonProps>;
  danger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonProps,
  danger = false,
}) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      size="small"
      scrollable={false}
    >
      <Text style={styles.confirmationMessage}>{message}</Text>
      <View style={styles.confirmationButtons}>
        <Button
          title={cancelText}
          variant="outline"
          onPress={onClose}
          style={{ flex: 1, marginRight: spacing.small }}
        />
        <Button
          title={confirmText}
          variant={danger ? 'danger' : 'primary'}
          onPress={() => {
            onConfirm();
            onClose();
          }}
          style={{ flex: 1, marginLeft: spacing.small }}
          {...confirmButtonProps}
        />
      </View>
    </Modal>
  );
};

// Alert modal component
export interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  buttonText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Ionicons name="checkmark-circle" size={48} color={colors.success} />;
      case 'warning':
        return <Ionicons name="warning" size={48} color={colors.warning} />;
      case 'error':
        return <Ionicons name="close-circle" size={48} color={colors.error} />;
      default:
        return <Ionicons name="information-circle" size={48} color={colors.info} />;
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="small"
      scrollable={false}
      showCloseButton={false}
    >
      <View style={styles.alertContent}>
        {getIcon()}
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <Button
          title={buttonText}
          variant="primary"
          onPress={onClose}
          fullWidth
          style={{ marginTop: spacing.large }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropBottom: {
    justifyContent: 'flex-end',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    marginLeft: spacing.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.large,
  },
  footer: {
    padding: spacing.large,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  confirmationMessage: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xlarge,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertContent: {
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});