import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/common/Button';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../config/theme';
import { APP_NAME } from '../../config/constants';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'UserType'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserTypeOption {
  id: 'devotee' | 'priest';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  benefits: string[];
}

export const UserTypeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedType, setSelectedType] = useState<'devotee' | 'priest' | null>(null);

  const userTypes: UserTypeOption[] = [
    {
      id: 'devotee',
      title: 'I am a Devotee',
      description: 'Looking for priests to perform religious ceremonies',
      icon: 'people',
      benefits: [
        'Find qualified priests near you',
        'Compare prices and services',
        'Book ceremonies instantly',
        'Secure payment protection',
      ],
    },
    {
      id: 'priest',
      title: 'I am a Priest',
      description: 'Offering religious services to the community',
      icon: 'person',
      benefits: [
        'Reach more devotees',
        'Manage your bookings',
        'Set your own prices',
        'Get paid securely',
      ],
    },
  ];

  const handleContinue = () => {
    if (!selectedType) return;

    if (selectedType === 'priest') {
      navigation.navigate('PriestType');
    } else {
      navigation.navigate('ProfileSetup', {
        userType: 'devotee',
      });
    }
  };

  const renderUserTypeCard = (type: UserTypeOption) => {
    const isSelected = selectedType === type.id;

    return (
      <TouchableOpacity
        key={type.id}
        style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}
        onPress={() => setSelectedType(type.id)}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[
            styles.iconContainer,
            isSelected && styles.iconContainerSelected,
          ]}>
            <Ionicons
              name={type.icon}
              size={32}
              color={isSelected ? colors.white : colors.primary}
            />
          </View>
          <View style={styles.selectionIndicator}>
            {isSelected ? (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.primary}
              />
            ) : (
              <View style={styles.radioButton} />
            )}
          </View>
        </View>

        {/* Content */}
        <Text style={[
          styles.cardTitle,
          isSelected && styles.cardTitleSelected,
        ]}>
          {type.title}
        </Text>
        <Text style={[
          styles.cardDescription,
          isSelected && styles.cardDescriptionSelected,
        ]}>
          {type.description}
        </Text>

        {/* Benefits */}
        <View style={styles.benefitsList}>
          {type.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons
                name="checkmark"
                size={16}
                color={isSelected ? colors.primary : colors.gray[600]}
                style={styles.benefitIcon}
              />
              <Text style={[
                styles.benefitText,
                isSelected && styles.benefitTextSelected,
              ]}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to use {APP_NAME}
          </Text>
        </View>

        {/* User Type Cards */}
        <View style={styles.cardsContainer}>
          {userTypes.map(renderUserTypeCard)}
        </View>

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedType}
          fullWidth
          size="large"
          style={styles.button}
        />

        {/* Note */}
        <Text style={styles.note}>
          You can always switch between roles later in settings
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.xlarge,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xlarge,
  },
  title: {
    fontSize: fontSize.xxlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  subtitle: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cardsContainer: {
    marginBottom: spacing.xlarge,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    marginBottom: spacing.medium,
    borderWidth: 2,
    borderColor: colors.gray[200],
    ...shadows.small,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.medium,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[400],
  },
  cardTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  cardTitleSelected: {
    color: colors.primary,
  },
  cardDescription: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.medium,
  },
  cardDescriptionSelected: {
    color: colors.text.primary,
  },
  benefitsList: {
    marginTop: spacing.small,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  benefitIcon: {
    marginRight: spacing.small,
  },
  benefitText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    flex: 1,
  },
  benefitTextSelected: {
    color: colors.text.primary,
  },
  button: {
    marginBottom: spacing.medium,
  },
  note: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});