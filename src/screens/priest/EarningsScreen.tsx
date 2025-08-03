import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PriestEarningsStackParamList } from '../../navigation/PriestNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { InlineLoader } from '../../components/common/LoadingSpinner';
import { useUser } from '../../contexts/UserContext';
import { useBooking } from '../../contexts/BookingContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice, formatDate } from '../../utils/formatters';
import { Payment, PaymentStatus } from '../../types/payment';

type NavigationProp = NativeStackNavigationProp<PriestEarningsStackParamList, 'EarningsOverview'>;

interface EarningsStats {
  totalEarnings: number;
  pendingPayments: number;
  availableBalance: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  totalBookings: number;
}

interface Transaction {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  date: Date;
  devoteeType: 'name';
  serviceName: string;
  platformFee: number;
  netAmount: number;
}

export const EarningsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state: userState } = useUser();
  const { state: bookingState } = useBooking();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    pendingPayments: 0,
    availableBalance: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    totalBookings: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const priestProfile = userState.profile?.userType === 'priest' ? userState.profile.priestProfile : null;

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    try {
      // Calculate stats from bookings
      const allBookings = [...bookingState.upcomingBookings, ...bookingState.pastBookings];
      const completedBookings = allBookings.filter(b => b.status === 'completed');
      
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Calculate earnings
      const totalEarnings = completedBookings.reduce((sum, b) => 
        sum + (b.priestEarnings || b.totalAmount * 0.7), 0
      );
      
      const thisMonthEarnings = completedBookings
        .filter(b => new Date(b.completedAt!) >= thisMonthStart)
        .reduce((sum, b) => sum + (b.priestEarnings || b.totalAmount * 0.7), 0);
      
      const lastMonthEarnings = completedBookings
        .filter(b => {
          const completedDate = new Date(b.completedAt!);
          return completedDate >= lastMonthStart && completedDate <= lastMonthEnd;
        })
        .reduce((sum, b) => sum + (b.priestEarnings || b.totalAmount * 0.7), 0);

      // Mock pending payments
      const pendingPayments = allBookings
        .filter(b => b.status === 'confirmed' && b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.priestEarnings || b.totalAmount * 0.7), 0);

      // Mock available balance (earnings minus platform fees and pending)
      const availableBalance = totalEarnings * 0.9; // After 10% platform fee

      setStats({
        totalEarnings,
        pendingPayments,
        availableBalance,
        thisMonthEarnings,
        lastMonthEarnings,
        totalBookings: completedBookings.length,
      });

      // Create transaction history
      const transactionHistory: Transaction[] = completedBookings.map(booking => ({
        id: booking.id,
        bookingId: booking.id,
        amount: booking.totalAmount,
        status: 'completed' as PaymentStatus,
        date: new Date(booking.completedAt!),
        devoteeType: booking.devotee.name,
        serviceName: booking.service.serviceName,
        platformFee: booking.totalAmount * 0.1, // 10% platform fee
        netAmount: booking.priestEarnings || booking.totalAmount * 0.7,
      }));

      setTransactions(transactionHistory.sort((a, b) => b.date.getTime() - a.date.getTime()));
    } catch (error) {
      console.error('Failed to load earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const handleWithdraw = () => {
    navigation.navigate('Withdraw');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Earnings</Text>
      <TouchableOpacity onPress={() => navigation.navigate('PaymentSettings')} style={styles.settingsButton}>
        <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderBalanceCard = () => (
    <Card margin="medium" style={styles.balanceCard}>
      <Text style={styles.balanceLabel}>Available Balance</Text>
      <Text style={styles.balanceAmount}>{formatPrice(stats.availableBalance)}</Text>
      
      <View style={styles.balanceStats}>
        <View style={styles.balanceStat}>
          <Text style={styles.balanceStatValue}>
            {formatPrice(stats.pendingPayments)}
          </Text>
          <Text style={styles.balanceStatLabel}>Pending</Text>
        </View>
        <View style={styles.balanceStatDivider} />
        <View style={styles.balanceStat}>
          <Text style={styles.balanceStatValue}>
            {stats.totalBookings}
          </Text>
          <Text style={styles.balanceStatLabel}>Total Bookings</Text>
        </View>
      </View>

      <Button
        title="Withdraw Funds"
        onPress={handleWithdraw}
        disabled={stats.availableBalance < 10} // Minimum $10 withdrawal
        fullWidth
        style={styles.withdrawButton}
      />
      
      {stats.availableBalance < 10 && (
        <Text style={styles.minimumNote}>
          Minimum withdrawal amount is $10
        </Text>
      )}
    </Card>
  );

  const renderEarningsChart = () => (
    <SectionCard 
      title="Earnings Overview"
      headerAction={
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      }
      margin="medium"
    >
      <View style={styles.earningsComparison}>
        <View style={styles.earningsPeriod}>
          <Text style={styles.periodLabel}>This Month</Text>
          <Text style={styles.periodAmount}>{formatPrice(stats.thisMonthEarnings)}</Text>
          {stats.thisMonthEarnings > stats.lastMonthEarnings ? (
            <View style={styles.changeIndicator}>
              <Ionicons name="trending-up" size={16} color={colors.success} />
              <Text style={[styles.changeText, { color: colors.success }]}>
                +{((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings * 100).toFixed(0)}%
              </Text>
            </View>
          ) : (
            <View style={styles.changeIndicator}>
              <Ionicons name="trending-down" size={16} color={colors.error} />
              <Text style={[styles.changeText, { color: colors.error }]}>
                {((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings * 100).toFixed(0)}%
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.earningsPeriod}>
          <Text style={styles.periodLabel}>Last Month</Text>
          <Text style={styles.periodAmount}>{formatPrice(stats.lastMonthEarnings)}</Text>
        </View>
      </View>
    </SectionCard>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
    >
      <View style={styles.transactionIcon}>
        <Ionicons name="cash" size={20} color={colors.success} />
      </View>
      
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionService} numberOfLines={1}>
          {item.serviceName}
        </Text>
        <Text style={styles.transactionDevotee} numberOfLines={1}>
          {item.devoteeType}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(item.date, 'MMM d, yyyy')}
        </Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={styles.transactionTotal}>
          +{formatPrice(item.netAmount)}
        </Text>
        <Text style={styles.transactionFee}>
          Fee: {formatPrice(item.platformFee)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTransactionHistory = () => (
    <SectionCard
      title="Transaction History"
      headerAction={
        <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      }
      margin="medium"
    >
      {transactions.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          message="No transactions yet"
          compact
        />
      ) : (
        <FlatList
          data={transactions.slice(0, 5)}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.transactionSeparator} />}
        />
      )}
    </SectionCard>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <InlineLoader text="Loading earnings..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {renderBalanceCard()}
        {renderEarningsChart()}
        {renderTransactionHistory()}
        
        <Card margin="medium" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={colors.info} />
            <Text style={styles.infoText}>
              Payments are processed weekly. Funds typically arrive within 2-3 business days.
            </Text>
          </View>
        </Card>
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
  settingsButton: {
    padding: spacing.small,
  },
  scrollContent: {
    paddingBottom: spacing.xlarge,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: fontSize.medium,
    color: colors.white + '80',
    marginBottom: spacing.small,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.large,
  },
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  balanceStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.white + '30',
  },
  balanceStatValue: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.xsmall,
  },
  balanceStatLabel: {
    fontSize: fontSize.small,
    color: colors.white + '80',
  },
  withdrawButton: {
    backgroundColor: colors.white,
    marginBottom: spacing.small,
  },
  minimumNote: {
    fontSize: fontSize.small,
    color: colors.white + '80',
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: spacing.xsmall,
  },
  periodButton: {
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.xsmall,
    borderRadius: borderRadius.small,
  },
  periodButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  periodButtonText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  periodButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  earningsComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.medium,
  },
  earningsPeriod: {
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  periodAmount: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  changeText: {
    fontSize: fontSize.small,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: fontSize.small,
    color: colors.primary,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionService: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  transactionDevotee: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  transactionDate: {
    fontSize: fontSize.xsmall,
    color: colors.text.secondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionTotal: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.xsmall,
  },
  transactionFee: {
    fontSize: fontSize.xsmall,
    color: colors.text.secondary,
  },
  transactionSeparator: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
  infoCard: {
    backgroundColor: colors.info + '10',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.small,
    lineHeight: fontSize.small * 1.4,
  },
});