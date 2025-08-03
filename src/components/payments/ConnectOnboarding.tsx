import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Button, OutlineButton } from '../common/Button';
import { Badge } from '../common/Badge';
import { PageLoader } from '../common/LoadingSpinner';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice } from '../../utils/formatters';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  required: boolean;
}

interface ConnectOnboardingProps {
  accountId?: string;
  onboardingUrl?: string;
  accountStatus?: 'pending' | 'active' | 'restricted' | 'disabled';
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification: string[];
  };
  onRefresh?: () => void;
  onStartOnboarding?: () => void;
}

export const ConnectOnboarding: React.FC<ConnectOnboardingProps> = ({
  accountId,
  onboardingUrl,
  accountStatus = 'pending',
  requirements,
  onRefresh,
  onStartOnboarding,
}) => {
  const [loading, setLoading] = useState(false);

  const getOnboardingSteps = (): OnboardingStep[] => {
    const steps: OnboardingStep[] = [
      {
        id: 'business_info',
        title: 'Business Information',
        description: 'Provide your business details and tax information',
        status: 'pending',
        required: true,
      },
      {
        id: 'bank_account',
        title: 'Bank Account',
        description: 'Add a bank account for receiving payouts',
        status: 'pending',
        required: true,
      },
      {
        id: 'identity',
        title: 'Identity Verification',
        description: 'Verify your identity with a government-issued ID',
        status: 'pending',
        required: true,
      },
      {
        id: 'tax_info',
        title: 'Tax Information',
        description: 'Provide tax identification details',
        status: 'pending',
        required: true,
      },
    ];

    // Update step statuses based on requirements
    if (requirements) {
      const allRequirements = [
        ...requirements.currentlyDue,
        ...requirements.eventuallyDue,
        ...requirements.pastDue,
      ];

      steps.forEach(step => {
        if (allRequirements.some(req => req.includes(step.id))) {
          step.status = requirements.pastDue.some(req => req.includes(step.id)) 
            ? 'error' 
            : 'in_progress';
        } else if (requirements.pendingVerification.some(req => req.includes(step.id))) {
          step.status = 'in_progress';
        }
      });

      // If account is active, mark all as completed
      if (accountStatus === 'active') {
        steps.forEach(step => {
          step.status = 'completed';
        });
      }
    }

    return steps;
  };

  const handleContinueOnboarding = async () => {
    if (onboardingUrl) {
      await Linking.openURL(onboardingUrl);
    }
  };

  const getStatusIcon = (status: OnboardingStep['status']) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color={colors.success} />;
      case 'in_progress':
        return <Ionicons name="time" size={24} color={colors.warning} />;
      case 'error':
        return <Ionicons name="alert-circle" size={24} color={colors.error} />;
      default:
        return <Ionicons name="ellipse-outline" size={24} color={colors.gray[400]} />;
    }
  };

  const getAccountStatusBadge = () => {
    switch (accountStatus) {
      case 'active':
        return <Badge label="Active" variant="success" />;
      case 'restricted':
        return <Badge label="Restricted" variant="warning" />;
      case 'disabled':
        return <Badge label="Disabled" variant="danger" />;
      default:
        return <Badge label="Pending Setup" variant="neutral" />;
    }
  };

  if (!accountId) {
    // New account setup
    return (
      <Card padding="large" style={styles.setupCard}>
        <View style={styles.setupIcon}>
          <Ionicons name="wallet" size={48} color={colors.primary} />
        </View>
        <Text style={styles.setupTitle}>Set Up Payouts</Text>
        <Text style={styles.setupDescription}>
          Connect your bank account to receive payments from your bookings. 
          Setup takes just a few minutes.
        </Text>
        
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.benefitText}>Automatic weekly payouts</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.benefitText}>Low 10% platform fee</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.benefitText}>Secure payment processing</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.benefitText}>Tax reporting support</Text>
          </View>
        </View>

        <Button
          title="Start Setup"
          onPress={onStartOnboarding}
          size="large"
          fullWidth
          style={styles.setupButton}
        />
      </Card>
    );
  }

  const steps = getOnboardingSteps();
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const hasErrors = steps.some(s => s.status === 'error');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card padding="medium" style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Account Status</Text>
          {getAccountStatusBadge()}
        </View>
        
        {accountId && (
          <Text style={styles.accountId}>Account ID: {accountId}</Text>
        )}

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(completedSteps / steps.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedSteps} of {steps.length} steps completed
          </Text>
        </View>
      </Card>

      {hasErrors && (
        <Card padding="medium" style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorTitle}>Action Required</Text>
          </View>
          <Text style={styles.errorText}>
            Please complete the required information to activate your account.
          </Text>
        </Card>
      )}

      <Card padding="medium" style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>Setup Checklist</Text>
        
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            <View style={styles.stepIcon}>
              {getStatusIcon(step.status)}
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={[
                  styles.stepTitle,
                  step.status === 'completed' && styles.stepTitleCompleted,
                ]}>
                  {step.title}
                </Text>
                {step.required && step.status !== 'completed' && (
                  <Badge label="Required" size="small" variant="neutral" />
                )}
              </View>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        {accountStatus !== 'active' && onboardingUrl && (
          <Button
            title={hasErrors ? 'Fix Issues' : 'Continue Setup'}
            onPress={handleContinueOnboarding}
            size="large"
            fullWidth
            style={styles.actionButton}
          />
        )}
        
        {onRefresh && (
          <OutlineButton
            title="Refresh Status"
            onPress={() => {
              setLoading(true);
              onRefresh();
              setTimeout(() => setLoading(false), 1000);
            }}
            loading={loading}
            fullWidth
            style={styles.actionButton}
          />
        )}
      </View>

      <View style={styles.helpSection}>
        <Ionicons name="help-circle" size={20} color={colors.gray[600]} />
        <Text style={styles.helpText}>
          Need help? Contact our support team at priest-support@devebhyo.com
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  setupCard: {
    alignItems: 'center',
    marginHorizontal: spacing.medium,
    marginVertical: spacing.large,
  },
  setupIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.large,
  },
  setupTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  setupDescription: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.large,
    lineHeight: fontSize.medium * 1.5,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: spacing.large,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    marginBottom: spacing.medium,
  },
  benefitText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  setupButton: {
    marginTop: spacing.medium,
  },
  statusCard: {
    marginHorizontal: spacing.medium,
    marginTop: spacing.medium,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  statusTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  accountId: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.medium,
  },
  progressContainer: {
    marginTop: spacing.medium,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.small,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorCard: {
    marginHorizontal: spacing.medium,
    marginTop: spacing.medium,
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
    borderWidth: 1,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  errorTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.error,
  },
  errorText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
  },
  stepsCard: {
    marginHorizontal: spacing.medium,
    marginTop: spacing.medium,
  },
  stepsTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  stepItem: {
    flexDirection: 'row',
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  stepIcon: {
    marginRight: spacing.medium,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xsmall,
  },
  stepTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stepTitleCompleted: {
    color: colors.text.secondary,
  },
  stepDescription: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
  },
  actions: {
    padding: spacing.medium,
    gap: spacing.medium,
  },
  actionButton: {
    marginBottom: 0,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    paddingHorizontal: spacing.medium,
    paddingBottom: spacing.large,
  },
  helpText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
  },
});