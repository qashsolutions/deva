import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PriestEarningsStackParamList } from '../../navigation/PriestNavigator';
import { ConnectOnboarding } from '../../components/payments/ConnectOnboarding';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize } from '../../config/theme';
import { createConnectAccount, createAccountLink, getAccountStatus } from '../../services/payments/connectService';

type NavigationProp = NativeStackNavigationProp<PriestEarningsStackParamList, 'ConnectSetup'>;

interface ConnectAccountData {
  accountId?: string;
  onboardingUrl?: string;
  accountStatus?: 'pending' | 'active' | 'restricted' | 'disabled';
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification: string[];
  };
}

export const ConnectSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state: userState, updateStripeConnectAccount } = useUser();
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<ConnectAccountData>({});

  const priestProfile = userState.profile?.userType === 'priest' ? userState.profile.priestProfile : null;

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      if (priestProfile?.stripeConnectAccountId) {
        // Existing account - get status
        const status = await getAccountStatus(priestProfile.stripeConnectAccountId);
        
        // Create new onboarding link if needed
        let onboardingUrl;
        if (status.status !== 'active') {
          const linkResult = await createAccountLink(
            priestProfile.stripeConnectAccountId,
            'https://devebhyo.com/connect/return',
            'https://devebhyo.com/connect/refresh'
          );
          onboardingUrl = linkResult.url;
        }

        setAccountData({
          accountId: priestProfile.stripeConnectAccountId,
          accountStatus: status.status,
          requirements: status.requirements,
          onboardingUrl,
        });
      }
    } catch (error) {
      console.error('Failed to load account data:', error);
      Alert.alert('Error', 'Failed to load payment account information');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    setLoading(true);
    
    try {
      // Create new Connect account
      const { accountId } = await createConnectAccount({
        type: 'express',
        country: 'US',
        email: userState.profile?.email || '',
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: `${userState.profile?.firstName} ${userState.profile?.lastName}`,
          product_description: 'Hindu religious ceremony services',
        },
      });

      // Save account ID to user profile
      await updateStripeConnectAccount(accountId);

      // Create onboarding link
      const { url } = await createAccountLink(
        accountId,
        'https://devebhyo.com/connect/return',
        'https://devebhyo.com/connect/refresh'
      );

      setAccountData({
        accountId,
        onboardingUrl: url,
        accountStatus: 'pending',
      });
      
      Alert.alert(
        'Account Created',
        'Your payment account has been created. Continue to complete the setup.',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Reload account data after user returns from Stripe
              loadAccountData();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to create Connect account:', error);
      Alert.alert('Error', 'Failed to create payment account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAccountData();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Payment Setup</Text>
      <View style={styles.placeholder} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <PageLoader text="Loading payment account..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ConnectOnboarding
          accountId={accountData.accountId}
          onboardingUrl={accountData.onboardingUrl}
          accountStatus={accountData.accountStatus}
          requirements={accountData.requirements}
          onRefresh={handleRefresh}
          onStartOnboarding={handleStartOnboarding}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    padding: spacing.small,
  },
  headerTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
});