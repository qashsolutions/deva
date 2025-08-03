import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice, formatDate } from '../../utils/formatters';
import { RefundStatus as RefundStatusType, Refund } from '../../types/payment';

interface RefundStatusProps {
  refund: Refund;
  onContactSupport?: () => void;
  onViewDetails?: () => void;
}

export const RefundStatus: React.FC<RefundStatusProps> = ({
  refund,
  onContactSupport,
  onViewDetails,
}) => {
  const getStatusColor = () => {
    switch (refund.status) {
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.info;
      case 'completed':
        return colors.success;
      case 'failed':
        return colors.error;
      default:
        return colors.gray[600];
    }
  };

  const getStatusIcon = () => {
    switch (refund.status) {
      case 'pending':
        return 'time-outline';
      case 'processing':
        return 'sync-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'failed':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusMessage = () => {
    switch (refund.status) {
      case 'pending':
        return 'Your refund request has been received and is pending approval.';
      case 'processing':
        return 'Your refund is being processed. This typically takes 5-7 business days.';
      case 'completed':
        return `Your refund of ${formatPrice(refund.amount)} has been completed.`;
      case 'failed':
        return 'Your refund could not be processed. Please contact support.';
      default:
        return 'Unknown refund status.';
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      {
        title: 'Refund Requested',
        date: refund.createdAt,
        completed: true,
      },
      {
        title: 'Processing',
        date: refund.processedAt,
        completed: refund.status !== 'pending',
      },
      {
        title: 'Completed',
        date: refund.completedAt,
        completed: refund.status === 'completed',
      },
    ];

    if (refund.status === 'failed') {
      steps[2] = {
        title: 'Failed',
        date: refund.failedAt,
        completed: true,
      };
    }

    return steps;
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
          <Ionicons
            name={getStatusIcon() as any}
            size={32}
            color={getStatusColor()}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Refund Status</Text>
          <Badge
            label={refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
            variant={
              refund.status === 'completed' ? 'success' :
              refund.status === 'failed' ? 'danger' :
              refund.status === 'processing' ? 'info' :
              'warning'
            }
          />
        </View>
      </View>

      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Refund Amount</Text>
        <Text style={styles.amountValue}>{formatPrice(refund.amount)}</Text>
        <Text style={styles.bookingId}>Booking #{refund.bookingId.slice(-6).toUpperCase()}</Text>
      </View>

      <Text style={[styles.statusMessage, { color: getStatusColor() }]}>
        {getStatusMessage()}
      </Text>

      <View style={styles.timeline}>
        {getTimelineSteps().map((step, index) => (
          <View key={index} style={styles.timelineStep}>
            <View style={styles.timelineIndicator}>
              <View style={[
                styles.timelineDot,
                step.completed && styles.timelineDotCompleted,
              ]} />
              {index < getTimelineSteps().length - 1 && (
                <View style={[
                  styles.timelineLine,
                  step.completed && styles.timelineLineCompleted,
                ]} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text style={[
                styles.timelineTitle,
                !step.completed && styles.timelineTitlePending,
              ]}>
                {step.title}
              </Text>
              {step.date && (
                <Text style={styles.timelineDate}>
                  {formatDate(new Date(step.date), 'MMM d, yyyy h:mm a')}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {refund.reason && (
        <View style={styles.reasonSection}>
          <Text style={styles.reasonLabel}>Reason for Refund</Text>
          <Text style={styles.reasonText}>{refund.reason}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {onViewDetails && (
          <Button
            title="View Details"
            variant="outline"
            onPress={onViewDetails}
            fullWidth
            style={styles.actionButton}
          />
        )}
        
        {refund.status === 'failed' && onContactSupport && (
          <Button
            title="Contact Support"
            onPress={onContactSupport}
            fullWidth
            style={styles.actionButton}
          />
        )}
      </View>

      {refund.status === 'processing' && (
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={16} color={colors.info} />
          <Text style={styles.infoText}>
            Refunds typically take 5-7 business days to appear in your account, 
            depending on your payment method and bank.
          </Text>
        </View>
      )}
    </Card>
  );
};

interface RefundStatusBadgeProps {
  status: RefundStatusType;
  size?: 'small' | 'medium';
}

export const RefundStatusBadge: React.FC<RefundStatusBadgeProps> = ({ 
  status, 
  size = 'medium' 
}) => {
  const getVariant = () => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'processing':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Badge
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      variant={getVariant()}
      size={size}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  amountSection: {
    backgroundColor: colors.gray[50],
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  amountLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  amountValue: {
    fontSize: fontSize.xxlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  bookingId: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  statusMessage: {
    fontSize: fontSize.medium,
    lineHeight: fontSize.medium * 1.5,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  timeline: {
    marginBottom: spacing.large,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  timelineIndicator: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray[300],
    borderWidth: 2,
    borderColor: colors.gray[300],
  },
  timelineDotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineLine: {
    position: 'absolute',
    top: 12,
    width: 2,
    height: '100%',
    backgroundColor: colors.gray[300],
  },
  timelineLineCompleted: {
    backgroundColor: colors.primary,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.medium,
  },
  timelineTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  timelineTitlePending: {
    color: colors.text.secondary,
  },
  timelineDate: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  reasonSection: {
    backgroundColor: colors.gray[50],
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.large,
  },
  reasonLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  reasonText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.4,
  },
  actions: {
    gap: spacing.medium,
  },
  actionButton: {
    marginBottom: 0,
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
});