import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/common/Button';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../config/theme';
import { PriestType } from '../../types/user';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PriestType'>;

interface PriestTypeOption {
  id: PriestType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  features: string[];
  requirements: string[];
}

export const PriestTypeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedType, setSelectedType] = useState<PriestType | null>(null);

  const priestTypes: PriestTypeOption[] = [
    {
      id: 'temple_employee',
      title: 'Temple Employee',
      description: 'I work at a temple and perform ceremonies on their behalf',
      icon: 'business',
      features: [
        'Represent your temple',
        'Temple handles payments',
        'Use temple facilities',
        'Temple insurance coverage',
      ],
      requirements: [
        'Temple authorization required',
        'Follow temple policies',
        'Revenue shared with temple',
      ],
    },
    {
      id: 'temple_owner',
      title: 'Temple Owner',
      description: 'I own or manage a temple and its priest services',
      icon: 'home',
      features: [
        'Manage multiple priests',
        'Set temple policies',
        'Handle all bookings',
        'Full payment control',
      ],
      requirements: [
        'Temple registration proof',
        'Tax ID verification',
        'Business documentation',
      ],
    },
    {
      id: 'independent',
      title: 'Independent Priest',
      description: 'I offer personal priest services independently',
      icon: 'person',
      features: [
        'Work independently',
        'Set your own rates',
        'Flexible schedule',
        'Keep all earnings',
      ],
      requirements: [
        'Personal verification',
        'Liability insurance',
        'Tax compliance',
      ],
    },
  ];

  const handleContinue = () => {
    if (!selectedType) return;

    navigation.navigate('ProfileSetup', {
      userType: 'priest',
      priestType: selectedType,
    });
  };

  const renderPriestTypeCard = (type: PriestTypeOption) => {
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
              size={28}
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

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features:</Text>
          {type.features.map((feature, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons
                name="checkmark"
                size={16}
                color={colors.success}
                style={styles.listIcon}
              />
              <Text style={[
                styles.listText,
                isSelected && styles.listTextSelected,
              ]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Requirements */}
        <View style={[styles.section, { marginTop: spacing.medium }]}>
          <Text style={styles.sectionTitle}>Requirements:</Text>
          {type.requirements.map((requirement, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons
                name="information-circle"
                size={16}
                color={colors.warning}
                style={styles.listIcon}
              />
              <Text style={[
                styles.listText,
                isSelected && styles.listTextSelected,
              ]}>
                {requirement}
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
          <Text style={styles.title}>Select Priest Type</Text>
          <Text style={styles.subtitle}>
            Choose the category that best describes you
          </Text>
        </View>

        {/* Priest Type Cards */}
        <View style={styles.cardsContainer}>
          {priestTypes.map(renderPriestTypeCard)}
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

        {/* Help Link */}
        <TouchableOpacity style={styles.helpContainer}>
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.helpText}>
            Not sure which type to choose?
          </Text>
        </TouchableOpacity>
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
    width: 56,
    height: 56,
    borderRadius: 28,
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
    lineHeight: fontSize.medium * 1.4,
  },
  cardDescriptionSelected: {
    color: colors.text.primary,
  },
  section: {
    marginTop: spacing.small,
  },
  sectionTitle: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xsmall,
  },
  listIcon: {
    marginRight: spacing.small,
    marginTop: 1,
  },
  listText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: fontSize.small * 1.4,
  },
  listTextSelected: {
    color: colors.text.primary,
  },
  button: {
    marginBottom: spacing.medium,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.medium,
  },
  helpText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    marginLeft: spacing.xsmall,
  },
});