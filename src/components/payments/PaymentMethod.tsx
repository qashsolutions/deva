import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

interface PaymentMethodProps {
  method: SavedPaymentMethod;
  isSelected?: boolean;
  onSelect?: () => void;
  onSetDefault?: () => void;
  onRemove?: () => void;
  showActions?: boolean;
}

export const PaymentMethod: React.FC<PaymentMethodProps> = ({
  method,
  isSelected = false,
  onSelect,
  onSetDefault,
  onRemove,
  showActions = true,
}) => {
  const handleRemove = () => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: onRemove,
        },
      ]
    );
  };

  const getCardIcon = () => {
    switch (method.brand?.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  const getBrandColor = () => {
    switch (method.brand?.toLowerCase()) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      default:
        return colors.gray[600];
    }
  };

  return (
    <TouchableOpacity
      onPress={onSelect}
      disabled={!onSelect}
      activeOpacity={onSelect ? 0.7 : 1}
    >
      <Card
        style={[
          styles.container,
          isSelected && styles.selectedContainer,
        ]}
        padding="medium"
      >
        <View style={styles.header}>
          <View style={styles.methodInfo}>
            <View style={[styles.iconContainer, { backgroundColor: getBrandColor() + '20' }]}>
              <Ionicons
                name={getCardIcon()}
                size={24}
                color={getBrandColor()}
              />
            </View>
            <View style={styles.details}>
              <View style={styles.brandRow}>
                <Text style={styles.brand}>
                  {method.brand || 'Card'} •••• {method.last4}
                </Text>
                {method.isDefault && (
                  <Badge label="Default" size="small" variant="primary" />
                )}
              </View>
              {method.expiryMonth && method.expiryYear && (
                <Text style={styles.expiry}>
                  Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear.toString().slice(-2)}
                </Text>
              )}
            </View>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.primary}
            />
          )}
        </View>

        {showActions && (
          <View style={styles.actions}>
            {!method.isDefault && onSetDefault && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onSetDefault}
              >
                <Ionicons name="star-outline" size={16} color={colors.primary} />
                <Text style={styles.actionText}>Set as Default</Text>
              </TouchableOpacity>
            )}
            {onRemove && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRemove}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

interface PaymentMethodListProps {
  methods: SavedPaymentMethod[];
  selectedId?: string;
  onSelect?: (method: SavedPaymentMethod) => void;
  onSetDefault?: (methodId: string) => void;
  onRemove?: (methodId: string) => void;
  onAddNew?: () => void;
  showActions?: boolean;
}

export const PaymentMethodList: React.FC<PaymentMethodListProps> = ({
  methods,
  selectedId,
  onSelect,
  onSetDefault,
  onRemove,
  onAddNew,
  showActions = true,
}) => {
  return (
    <View style={styles.list}>
      {methods.map((method) => (
        <PaymentMethod
          key={method.id}
          method={method}
          isSelected={method.id === selectedId}
          onSelect={() => onSelect?.(method)}
          onSetDefault={() => onSetDefault?.(method.id)}
          onRemove={() => onRemove?.(method.id)}
          showActions={showActions}
        />
      ))}
      
      {onAddNew && (
        <TouchableOpacity onPress={onAddNew}>
          <Card style={styles.addNewCard} padding="medium">
            <View style={styles.addNewContent}>
              <View style={styles.addNewIcon}>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.addNewText}>Add Payment Method</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </Card>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.small,
  },
  selectedContainer: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  details: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  brand: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  expiry: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xsmall,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing.large,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  actionText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    gap: spacing.small,
  },
  addNewCard: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.gray[50],
  },
  addNewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addNewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  addNewText: {
    flex: 1,
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.primary,
  },
});