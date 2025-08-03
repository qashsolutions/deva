import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PricingAssistant } from '../../components/ai/PricingAssistant';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { pricingService } from '../../services/ai/pricingService';
import { PricingInsight, PricingQuery } from '../../types/ai';
import { ServiceOffering } from '../../types/user';
import { formatPrice } from '../../utils/formatters';
import { getPriestServices, updateServicePricing } from '../../services/firestore';

type RootStackParamList = {
  PricingInsights: undefined;
  ServiceManagement: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PricingInsights'>;

export const PricingInsightsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuth();
  const { user } = useUser();
  
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null);
  const [insight, setInsight] = useState<PricingInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.userType !== 'priest') {
      Alert.alert(
        'Access Restricted',
        'This feature is only available for priests.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    
    loadServices();
  }, [user]);

  const loadServices = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const priestServices = await getPriestServices(currentUser.uid);
      setServices(priestServices);
      
      if (priestServices.length > 0 && !selectedService) {
        setSelectedService(priestServices[0]);
        loadPricingInsight(priestServices[0]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadPricingInsight = async (service: ServiceOffering) => {
    if (!user?.location) return;
    
    setLoading(true);
    try {
      const query: PricingQuery = {
        serviceType: service.serviceName,
        location: user.location,
        priestExperience: user.priestProfile?.yearsOfExperience || 0,
        duration: service.duration,
        includeTravel: service.travelAvailable,
      };
      
      const insightData = await pricingService.getMarketInsights(query);
      setInsight(insightData);
    } catch (error) {
      console.error('Error loading pricing insight:', error);
      Alert.alert('Error', 'Failed to load pricing insights');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    if (selectedService) {
      await loadPricingInsight(selectedService);
    }
    setRefreshing(false);
  };

  const handleUpdatePricing = async (newPrice: number) => {
    if (!selectedService || !currentUser?.uid) return;
    
    Alert.alert(
      'Update Pricing',
      `Are you sure you want to update the price to ${formatPrice(newPrice)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateServicePricing(
                currentUser.uid,
                selectedService.id,
                { type: 'fixed', fixed: newPrice }
              );
              
              Alert.alert('Success', 'Price updated successfully');
              loadServices();
            } catch (error) {
              console.error('Error updating price:', error);
              Alert.alert('Error', 'Failed to update price');
            }
          },
        },
      ]
    );
  };

  const renderServiceSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.serviceSelector}
      contentContainerStyle={styles.serviceSelectorContent}
    >
      {services.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.serviceChip,
            selectedService?.id === service.id && styles.serviceChipActive,
          ]}
          onPress={() => {
            setSelectedService(service);
            loadPricingInsight(service);
          }}
        >
          <Text style={[
            styles.serviceChipText,
            selectedService?.id === service.id && styles.serviceChipTextActive,
          ]}>
            {service.serviceName}
          </Text>
          <Badge
            text={formatPrice(
              service.pricing.type === 'fixed'
                ? service.pricing.fixed!
                : service.pricing.rangeMin!
            )}
            variant={selectedService?.id === service.id ? 'primary' : 'secondary'}
            size="small"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderInsightSummary = () => {
    if (!insight || !selectedService) return null;
    
    const currentPrice = selectedService.pricing.type === 'fixed'
      ? selectedService.pricing.fixed!
      : (selectedService.pricing.rangeMin! + selectedService.pricing.rangeMax!) / 2;
    
    const priceDiff = currentPrice - insight.recommendations.suggestedPrice;
    const percentDiff = (priceDiff / insight.recommendations.suggestedPrice) * 100;
    
    return (
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons name="bulb" size={24} color={colors.warning} />
          <Text style={styles.summaryTitle}>Quick Insights</Text>
        </View>
        
        <View style={styles.insightItems}>
          <View style={styles.insightItem}>
            <Ionicons
              name={Math.abs(percentDiff) < 10 ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={Math.abs(percentDiff) < 10 ? colors.success : colors.warning}
            />
            <Text style={styles.insightText}>
              Your price is {Math.abs(percentDiff).toFixed(0)}% {priceDiff > 0 ? 'above' : 'below'} market average
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Ionicons
              name="trending-up"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.insightText}>
              Demand is {insight.marketAnalysis.demandLevel} in your area
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <Ionicons
              name="people"
              size={20}
              color={colors.info}
            />
            <Text style={styles.insightText}>
              {insight.marketAnalysis.competitorCount} other priests offer this service
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (services.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pricing Insights</Text>
          <View style={styles.placeholder} />
        </View>
        
        <EmptyState
          icon="analytics"
          title="No Services Yet"
          message="Create services to see pricing insights"
          actionLabel="Create Service"
          onAction={() => navigation.navigate('ServiceManagement')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pricing Insights</Text>
        <TouchableOpacity style={styles.aiIndicator}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.introduction}>
          <Text style={styles.introTitle}>AI-Powered Pricing</Text>
          <Text style={styles.introText}>
            Get market insights and optimize your pricing based on demand, competition, and trends
          </Text>
        </View>

        {renderServiceSelector()}
        {renderInsightSummary()}
        
        {selectedService && insight && (
          <PricingAssistant
            insight={insight}
            loading={loading}
            onUpdatePricing={handleUpdatePricing}
            currentPrice={
              selectedService.pricing.type === 'fixed'
                ? selectedService.pricing.fixed
                : (selectedService.pricing.rangeMin! + selectedService.pricing.rangeMax!) / 2
            }
          />
        )}
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
  aiIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  introduction: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.large,
  },
  introTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  introText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    lineHeight: fontSize.medium * 1.4,
  },
  serviceSelector: {
    marginBottom: spacing.medium,
  },
  serviceSelectorContent: {
    paddingHorizontal: spacing.medium,
    gap: spacing.small,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.gray[300],
    marginRight: spacing.small,
    gap: spacing.small,
  },
  serviceChipActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  serviceChipText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  serviceChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    gap: spacing.small,
  },
  summaryTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  insightItems: {
    gap: spacing.medium,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.small,
  },
  insightText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    flex: 1,
    lineHeight: fontSize.medium * 1.4,
  },
});