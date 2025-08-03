import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice } from '../../utils/formatters';

interface EarningsData {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  lastPayout?: {
    amount: number;
    date: Date;
    status: 'processing' | 'completed' | 'failed';
  };
  nextPayoutDate?: Date;
  currency?: string;
}

interface EarningsCardProps {
  earnings: EarningsData;
  onWithdraw?: () => void;
  onViewHistory?: () => void;
  loading?: boolean;
  compact?: boolean;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({
  earnings,
  onWithdraw,
  onViewHistory,
  loading = false,
  compact = false,
}) => {
  const canWithdraw = earnings.availableBalance >= 10; // Minimum $10 withdrawal

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge label="Paid" size="small" variant="success" />;
      case 'processing':
        return <Badge label="Processing" size="small" variant="warning" />;
      case 'failed':
        return <Badge label="Failed" size="small" variant="danger" />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <Card style={styles.compactCard}>
        <View style={styles.compactContent}>
          <View style={styles.compactInfo}>
            <Text style={styles.compactLabel}>Available Balance</Text>
            <Text style={styles.compactAmount}>
              {formatPrice(earnings.availableBalance)}
            </Text>
          </View>
          {onWithdraw && (
            <Button
              title="Withdraw"
              onPress={onWithdraw}
              size="small"
              disabled={!canWithdraw}
            />
          )}
        </View>
        {earnings.pendingBalance > 0 && (
          <Text style={styles.compactPending}>
            +{formatPrice(earnings.pendingBalance)} pending
          </Text>
        )}
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>Earnings Overview</Text>
      </View>

      <View style={styles.balanceSection}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>
            {formatPrice(earnings.availableBalance)}
          </Text>
        </View>
        
        <View style={styles.balanceDivider} />
        
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>Pending</Text>
          <Text style={[styles.balanceAmount, { color: colors.warning }]}>
            {formatPrice(earnings.pendingBalance)}
          </Text>
        </View>
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={20} color={colors.gray[600]} />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={styles.statValue}>
              {formatPrice(earnings.totalEarnings)}
            </Text>
          </View>
        </View>

        {earnings.nextPayoutDate && (
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={20} color={colors.gray[600]} />
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Next Payout</Text>
              <Text style={styles.statValue}>
                {new Date(earnings.nextPayoutDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}
      </View>

      {earnings.lastPayout && (
        <View style={styles.lastPayoutSection}>
          <View style={styles.lastPayoutHeader}>
            <Text style={styles.lastPayoutTitle}>Last Payout</Text>
            {getPayoutStatusBadge(earnings.lastPayout.status)}
          </View>
          <View style={styles.lastPayoutInfo}>
            <Text style={styles.lastPayoutAmount}>
              {formatPrice(earnings.lastPayout.amount)}
            </Text>
            <Text style={styles.lastPayoutDate}>
              {new Date(earnings.lastPayout.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {onWithdraw && (
          <Button
            title="Withdraw Funds"
            onPress={onWithdraw}
            disabled={!canWithdraw || loading}
            loading={loading}
            fullWidth
            style={styles.withdrawButton}
          />
        )}
        
        {!canWithdraw && (
          <Text style={styles.minimumNote}>
            Minimum withdrawal amount is $10
          </Text>
        )}

        {onViewHistory && (
          <TouchableOpacity
            style={styles.historyButton}
            onPress={onViewHistory}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={styles.historyButtonText}>View Payout History</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={16} color={colors.info} />
        <Text style={styles.infoText}>
          Payouts are processed weekly on Mondays. Funds typically arrive within 2-3 business days.
        </Text>
      </View>
    </Card>
  );
};

export const MiniEarningsCard: React.FC<{ 
  amount: number; 
  label?: string;
  onPress?: () => void;
}> = ({ 
  amount, 
  label = 'Available Balance',
  onPress 
}) => {
  return (
    <TouchableOpacity
      style={styles.miniCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.miniContent}>
        <Ionicons name="wallet-outline" size={20} color={colors.primary} />
        <View style={styles.miniInfo}>
          <Text style={styles.miniLabel}>{label}</Text>
          <Text style={styles.miniAmount}>{formatPrice(amount)}</Text>
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.large,
  },
  compactCard: {
    padding: spacing.medium,
  },
  compactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
  },
  compactLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  compactAmount: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.primary,
  },
  compactPending: {
    fontSize: fontSize.small,
    color: colors.warning,
    marginTop: spacing.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  title: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  balanceSection: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginBottom: spacing.large,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.medium,
  },
  balanceLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  balanceAmount: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.primary,
  },
  statsSection: {
    gap: spacing.medium,
    marginBottom: spacing.large,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  statValue: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lastPayoutSection: {
    backgroundColor: colors.gray[50],
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.large,
  },
  lastPayoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  lastPayoutTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lastPayoutInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastPayoutAmount: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  lastPayoutDate: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.medium,
  },
  withdrawButton: {
    marginBottom: 0,
  },
  minimumNote: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  historyButtonText: {
    flex: 1,
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.small,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.info + '10',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginTop: spacing.medium,
    gap: spacing.small,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
  },
  miniCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  miniContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  miniLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  miniAmount: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
});