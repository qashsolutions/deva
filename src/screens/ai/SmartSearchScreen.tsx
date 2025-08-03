import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PriestRecommendations } from '../../components/ai/PriestRecommendations';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { priestMatchingService } from '../../services/ai/matchingService';
import { MatchingCriteria, PriestRecommendation } from '../../types/ai';
import { isFeatureEnabled } from '../../config/ai';

type RootStackParamList = {
  SmartSearch: undefined;
  PriestDetail: { priestId: string };
  BookingFlow: { priestId: string; serviceId?: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SmartSearch'>;

export const SmartSearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { currentUser } = useAuth();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<PriestRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<MatchingCriteria>>({
    languages: user?.languages || [],
    dateRange: undefined,
    budget: undefined,
    priestType: undefined,
  });

  const exampleQueries = [
    'I need a priest for my daughter\'s naming ceremony next month',
    'Looking for Tamil-speaking priest for house blessing',
    'Need experienced priest for wedding ceremony in May',
    'Searching for priest who can perform Satyanarayan Puja',
  ];

  useEffect(() => {
    if (!isFeatureEnabled('smartSearch')) {
      Alert.alert(
        'Feature Unavailable',
        'Smart search is currently not available. Please use regular search.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const criteria: MatchingCriteria = {
        query,
        location: user?.location || {
          address: '',
          city: 'Unknown',
          state: 'Unknown',
          zipCode: '00000',
          coordinates: { lat: 0, lng: 0 },
        },
        ...filters,
      };

      const results = await priestMatchingService.findBestMatches(criteria);
      setRecommendations(results);
      
      if (results.length === 0) {
        Alert.alert(
          'No Matches Found',
          'Try adjusting your search or expanding your criteria.'
        );
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePriestSelect = (priestId: string) => {
    navigation.navigate('PriestDetail', { priestId });
  };

  const handleExampleQuery = (example: string) => {
    setQuery(example);
    setTimeout(handleSearch, 100);
  };

  const renderSearchInput = () => (
    <Card style={styles.searchCard}>
      <Text style={styles.searchTitle}>What are you looking for?</Text>
      <Text style={styles.searchSubtitle}>
        Describe your needs in natural language
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="e.g., 'I need a Telugu priest for house warming next weekend'"
          placeholderTextColor={colors.gray[400]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        
        <TouchableOpacity
          style={styles.micButton}
          onPress={() => Alert.alert('Voice Search', 'Voice search coming soon!')}
        >
          <Ionicons name="mic" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchActions}>
        <Button
          title="Search"
          onPress={handleSearch}
          loading={loading}
          disabled={!query.trim()}
          icon="search"
          fullWidth
        />
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color={colors.primary} />
          <Text style={styles.filterText}>Filters</Text>
          {Object.keys(filters).filter(k => filters[k as keyof typeof filters]).length > 0 && (
            <Badge
              text={Object.keys(filters).filter(k => filters[k as keyof typeof filters]).length.toString()}
              variant="primary"
              size="small"
            />
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderExamples = () => {
    if (recommendations.length > 0) return null;
    
    return (
      <View style={styles.examplesSection}>
        <Text style={styles.examplesTitle}>Try these searches:</Text>
        {exampleQueries.map((example, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exampleCard}
            onPress={() => handleExampleQuery(example)}
          >
            <Ionicons name="search" size={16} color={colors.gray[600]} />
            <Text style={styles.exampleText}>{example}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <Card style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>Refine Your Search</Text>
        
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Priest Type</Text>
          <View style={styles.filterOptions}>
            {[
              { value: 'temple_employee', label: 'Temple Priest' },
              { value: 'independent', label: 'Independent' },
              { value: 'temple_owner', label: 'Temple Owner' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  filters.priestType === option.value && styles.filterOptionActive,
                ]}
                onPress={() => setFilters({
                  ...filters,
                  priestType: filters.priestType === option.value ? undefined : option.value as any,
                })}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.priestType === option.value && styles.filterOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Budget Range</Text>
          <View style={styles.budgetInputs}>
            <TextInput
              style={styles.budgetInput}
              placeholder="Min"
              keyboardType="numeric"
              value={filters.budget?.min?.toString() || ''}
              onChangeText={(text) => setFilters({
                ...filters,
                budget: {
                  min: text ? parseInt(text) : 0,
                  max: filters.budget?.max || 1000,
                },
              })}
            />
            <Text style={styles.budgetSeparator}>-</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="Max"
              keyboardType="numeric"
              value={filters.budget?.max?.toString() || ''}
              onChangeText={(text) => setFilters({
                ...filters,
                budget: {
                  min: filters.budget?.min || 0,
                  max: text ? parseInt(text) : 1000,
                },
              })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.clearFilters}
          onPress={() => setFilters({})}
        >
          <Text style={styles.clearFiltersText}>Clear All Filters</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smart Search</Text>
          <View style={styles.aiIndicator}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderSearchInput()}
          {renderFilters()}
          {renderExamples()}
          
          {recommendations.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                Found {recommendations.length} matches for you
              </Text>
              <PriestRecommendations
                recommendations={recommendations}
                onSelectPriest={handlePriestSelect}
                loading={loading}
                onRefresh={handleSearch}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  contentContainer: {
    paddingVertical: spacing.medium,
  },
  searchCard: {
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  searchTitle: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  searchSubtitle: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.large,
  },
  inputContainer: {
    position: 'relative',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    paddingRight: spacing.xlarge + 24,
    fontSize: fontSize.medium,
    color: colors.text.primary,
    minHeight: 80,
  },
  micButton: {
    position: 'absolute',
    right: spacing.medium,
    top: spacing.medium,
  },
  searchActions: {
    marginTop: spacing.medium,
    gap: spacing.medium,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
    paddingVertical: spacing.small,
  },
  filterText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  examplesSection: {
    paddingHorizontal: spacing.medium,
  },
  examplesTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.small,
    gap: spacing.small,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  exampleText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  filtersCard: {
    marginHorizontal: spacing.medium,
    marginBottom: spacing.medium,
    padding: spacing.large,
  },
  filtersTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  filterSection: {
    marginBottom: spacing.large,
  },
  filterLabel: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.small,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  filterOption: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: fontSize.small,
    color: colors.text.primary,
  },
  filterOptionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  budgetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  budgetInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    padding: spacing.small,
    fontSize: fontSize.medium,
    textAlign: 'center',
  },
  budgetSeparator: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  clearFilters: {
    alignItems: 'center',
    paddingVertical: spacing.small,
  },
  clearFiltersText: {
    fontSize: fontSize.medium,
    color: colors.error,
    fontWeight: '600',
  },
  resultsSection: {
    paddingHorizontal: spacing.medium,
  },
  resultsTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
});