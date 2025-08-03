import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice } from '../../utils/formatters';
import { purchasePremiumPlacement } from '../../services/firestore';

type RootStackParamList = {
  PremiumPromotion: undefined;
  Payment: { amount: number; purpose: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PremiumPromotion'>;

interface PremiumTier {
  id: 'silver' | 'gold' | 'platinum';
  name: string;
  price: number;
  features: string[];
  color: string;
  priority: number;
}

export const PremiumPromotionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuth();
  const { user } = useUser();
  
  const [selectedTier, setSelectedTier] = useState<'silver' | 'gold' | 'platinum'>('silver');
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [loading, setLoading] = useState(false);

  const tiers: PremiumTier[] = [
    {
      id: 'silver',
      name: 'Silver',
      price: 99,
      features: [
        'Featured in top 3 results',
        'Silver badge on profile',
        '7 days visibility',
        'Basic priority ranking',
      ],
      color: colors.gray[500],
      priority: 1,
    },
    {
      id: 'gold',
      name: 'Gold',
      price: 199,
      features: [
        'Featured in top 3 results',
        'Gold badge on profile',
        '7 days visibility',
        'High priority ranking',
        'Highlighted listing',
      ],
      color: colors.warning,
      priority: 2,
    },
    {
      id: 'platinum',
      name: 'Platinum',
      price: 299,
      features: [
        'Featured in top 3 results',
        'Platinum badge on profile',
        '7 days visibility',
        'Highest priority ranking',
        'Premium highlighted listing',
        'Push notification to devotees',
      ],
      color: colors.primary,
      priority: 3,
    },
  ];

  useEffect(() => {
    if (user?.location?.zipCode) {
      setSelectedZipCodes([user.location.zipCode]);
    }
  }, [user]);

  const handleAddZipCode = () => {
    if (zipCodeInput.length === 5 && !selectedZipCodes.includes(zipCodeInput)) {
      setSelectedZipCodes([...selectedZipCodes, zipCodeInput]);
      setZipCodeInput('');
    }
  };

  const handleRemoveZipCode = (zip: string) => {
    setSelectedZipCodes(selectedZipCodes.filter(z => z !== zip));
  };

  const calculateTotal = () => {
    const tier = tiers.find(t => t.id === selectedTier);
    return (tier?.price || 0) * selectedZipCodes.length;
  };

  const handlePurchase = async () => {
    if (selectedZipCodes.length === 0) {
      Alert.alert('Error', 'Please select at least one ZIP code');
      return;
    }

    setLoading(true);
    try {
      const total = calculateTotal();
      
      // Navigate to payment screen
      navigation.navigate('Payment', {
        amount: total,
        purpose: `Premium ${selectedTier} placement for ${selectedZipCodes.length} ZIP codes`,
      });

      // After successful payment, this would be called:
      // await purchasePremiumPlacement(
      //   currentUser!.uid,
      //   selectedZipCodes,
      //   selectedTier,
      //   total
      // );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to process premium purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Promotion</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Ionicons name="star" size={48} color={colors.warning} />
          <Text style={styles.introTitle}>Get Featured in Search Results</Text>
          <Text style={styles.introText}>
            Boost your visibility and attract more devotees by appearing in the top 3 search results for your selected ZIP codes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {tiers.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              onPress={() => setSelectedTier(tier.id)}
              style={[
                styles.tierCard,
                selectedTier === tier.id && styles.tierCardActive,
                { borderColor: selectedTier === tier.id ? tier.color : colors.gray[300] }
              ]}
            >
              <View style={styles.tierHeader}>
                <View>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  <Text style={styles.tierPrice}>{formatPrice(tier.price)}/ZIP code</Text>
                </View>
                {selectedTier === tier.id && (
                  <Ionicons name="checkmark-circle" size={24} color={tier.color} />
                )}
              </View>
              <View style={styles.tierFeatures}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color={colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select ZIP Codes</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the ZIP codes where you want to be featured
          </Text>
          
          <View style={styles.zipCodeInput}>
            <TextInput
              style={styles.input}
              placeholder="Enter ZIP code"
              value={zipCodeInput}
              onChangeText={setZipCodeInput}
              keyboardType="numeric"
              maxLength={5}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddZipCode}
              disabled={zipCodeInput.length !== 5}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.selectedZipCodes}>
            {selectedZipCodes.map((zip) => (
              <View key={zip} style={styles.zipChip}>
                <Text style={styles.zipChipText}>{zip}</Text>
                <TouchableOpacity onPress={() => handleRemoveZipCode(zip)}>
                  <Ionicons name="close-circle" size={20} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {tiers.find(t => t.id === selectedTier)?.name} × {selectedZipCodes.length} ZIP codes
            </Text>
            <Text style={styles.summaryValue}>{formatPrice(calculateTotal())}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>7 days</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(calculateTotal())}</Text>
          </View>
        </Card>

        <View style={styles.footer}>
          <Button
            title="Purchase Premium Placement"
            onPress={handlePurchase}
            loading={loading}
            disabled={selectedZipCodes.length === 0}
            fullWidth
          />
          <Text style={styles.disclaimer}>
            Premium placement is valid for 7 days from purchase. You will appear in the top 3 
            search results for devotees searching in your selected ZIP codes.
          </Text>
        </View>
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
  intro: {
    alignItems: 'center',
    padding: spacing.xlarge,
  },
  introTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.medium,
    textAlign: 'center',
  },
  introText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginTop: spacing.small,
    textAlign: 'center',
    lineHeight: fontSize.medium * 1.4,
  },
  section: {
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.xlarge,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  sectionSubtitle: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.medium,
  },
  tierCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.large,
    marginBottom: spacing.medium,
    borderWidth: 2,
  },
  tierCardActive: {
    backgroundColor: colors.primary + '10',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  tierName: {
    fontSize: fontSize.large,
    fontWeight: '700',
    marginBottom: spacing.xsmall,
  },
  tierPrice: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  tierFeatures: {
    gap: spacing.small,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  featureText: {
    fontSize: fontSize.small,
    color: colors.text.primary,
    flex: 1,
  },
  zipCodeInput: {
    flexDirection: 'row',
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    fontSize: fontSize.medium,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedZipCodes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  zipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.large,
    gap: spacing.xsmall,
  },
  zipChipText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  summaryCard: {
    marginHorizontal: spacing.medium,
    padding: spacing.large,
    marginBottom: spacing.medium,
  },
  summaryTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  summaryLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.small,
    marginTop: spacing.small,
  },
  totalLabel: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    padding: spacing.medium,
  },
  disclaimer: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.medium,
    lineHeight: fontSize.small * 1.4,
  },
});