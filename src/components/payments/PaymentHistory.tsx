import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { InlineLoader } from '../common/LoadingSpinner';
import { colors, spacing, fontSize } from '../../config/theme';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Payment, PaymentStatus } from '../../types/payment';

interface PaymentHistoryProps {
  payments: Payment[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPaymentPress?: (payment: Payment) => void;
  emptyMessage?: string;
  showFilters?: boolean;
}

type FilterType = 'all' | PaymentStatus;

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  payments,
  loading = false,
  refreshing = false,
  onRefresh,
  onPaymentPress,
  emptyMessage = 'No payment history',
  showFilters = true,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const getFilteredPayments = () => {
    if (filter === 'all') return payments;
    return payments.filter(p => p.status === filter);
  };

  const getPaymentIcon = (payment: Payment) => {
    switch (payment.type) {
      case 'booking_payment':
        return 'calendar';
      case 'refund':
        return 'refresh';
      case 'payout':
        return 'cash';
      default:
        return 'card';
    }
  };

  const getPaymentColor = (payment: Payment) => {
    if (payment.type === 'refund') return colors.warning;
    if (payment.type === 'payout') return colors.success;
    
    switch (payment.status) {
      case 'completed':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'processing':
        return colors.info;
      default:
        return colors.gray[600];
    }
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    const filters: { label: string; value: FilterType }[] = [
      { label: 'All', value: 'all' },
      { label: 'Completed', value: 'completed' },
      { label: 'Pending', value: 'pending' },
      { label: 'Failed', value: 'failed' },
    ];

    return (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.filterChip,
                filter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const color = getPaymentColor(item);
    const icon = getPaymentIcon(item);

    return (
      <TouchableOpacity
        onPress={() => onPaymentPress?.(item)}
        disabled={!onPaymentPress}
        activeOpacity={onPaymentPress ? 0.7 : 1}
      >
        <Card style={styles.paymentCard} padding="medium">
          <View style={styles.paymentHeader}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon as any} size={24} color={color} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentDescription} numberOfLines={1}>
                {item.description}
              </Text>
              <Text style={styles.paymentDate}>
                {formatDate(new Date(item.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.paymentAmount}>
              <Text
                style={[
                  styles.amountText,
                  { color: item.type === 'refund' ? colors.error : colors.success },
                ]}
              >
                {item.type === 'refund' ? '-' : '+'}{formatPrice(item.amount)}
              </Text>
              <Badge
                label={item.status}
                size="small"
                variant={
                  item.status === 'completed' ? 'success' :
                  item.status === 'failed' ? 'danger' :
                  item.status === 'processing' ? 'info' :
                  'neutral'
                }
              />
            </View>
          </View>

          {item.metadata && (
            <View style={styles.metadata}>
              {item.metadata.bookingId && (
                <Text style={styles.metadataText}>
                  Booking #{item.metadata.bookingId.slice(-6).toUpperCase()}
                </Text>
              )}
              {item.metadata.paymentMethod && (
                <Text style={styles.metadataText}>
                  •••• {item.metadata.paymentMethod.last4}
                </Text>
              )}
            </View>
          )}

          {onPaymentPress && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.gray[400]}
              style={styles.chevron}
            />
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return <InlineLoader text="Loading payment history..." />;
    }

    const filteredPayments = getFilteredPayments();

    if (filteredPayments.length === 0) {
      return (
        <EmptyState
          icon="receipt-outline"
          title={filter === 'all' ? emptyMessage : `No ${filter} payments`}
          message={filter !== 'all' ? 'Try selecting a different filter' : undefined}
          action={
            filter !== 'all'
              ? {
                  label: 'Clear Filter',
                  onPress: () => setFilter('all'),
                }
              : undefined
          }
        />
      );
    }

    return (
      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderFilters()}
      {renderContent()}
    </View>
  );
};

interface PaymentSummaryProps {
  totalIn: number;
  totalOut: number;
  period?: string;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  totalIn,
  totalOut,
  period = 'This Month',
}) => {
  const netAmount = totalIn - totalOut;

  return (
    <Card style={styles.summaryCard}>
      <Text style={styles.summaryPeriod}>{period}</Text>
      
      <View style={styles.summaryAmounts}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="arrow-down" size={20} color={colors.success} />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Received</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>
              {formatPrice(totalIn)}
            </Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="arrow-up" size={20} color={colors.error} />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Refunded</Text>
            <Text style={[styles.summaryAmount, { color: colors.error }]}>
              {formatPrice(totalOut)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.netSection}>
        <Text style={styles.netLabel}>Net Amount</Text>
        <Text style={[
          styles.netAmount,
          { color: netAmount >= 0 ? colors.success : colors.error },
        ]}>
          {formatPrice(Math.abs(netAmount))}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterScroll: {
    paddingHorizontal: spacing.medium,
    gap: spacing.small,
  },
  filterChip: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.xsmall,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    marginRight: spacing.small,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: spacing.medium,
  },
  paymentCard: {
    marginHorizontal: spacing.medium,
    marginBottom: spacing.small,
    position: 'relative',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDescription: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  paymentDate: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  paymentAmount: {
    alignItems: 'flex-end',
    gap: spacing.xsmall,
  },
  amountText: {
    fontSize: fontSize.large,
    fontWeight: '700',
  },
  metadata: {
    flexDirection: 'row',
    gap: spacing.medium,
    marginTop: spacing.small,
    marginLeft: 48 + spacing.medium,
  },
  metadataText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  chevron: {
    position: 'absolute',
    right: spacing.medium,
    top: '50%',
    marginTop: -10,
  },
  summaryCard: {
    padding: spacing.large,
    margin: spacing.medium,
  },
  summaryPeriod: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  summaryAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.large,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  summaryAmount: {
    fontSize: fontSize.large,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
  },
  netSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.medium,
    alignItems: 'center',
  },
  netLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  netAmount: {
    fontSize: fontSize.xxlarge,
    fontWeight: '700',
  },
});