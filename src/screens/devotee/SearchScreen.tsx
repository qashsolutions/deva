import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { DevoteeSearchStackParamList } from '../../navigation/DevoteeNavigator';
import { Card } from '../../components/common/Card';
import { Avatar, UserAvatar } from '../../components/common/Avatar';
import { Badge, TagGroup } from '../../components/common/Badge';
import { CompactRating } from '../../components/common/Rating';
import { Button, OutlineButton } from '../../components/common/Button';
import { NoResultsEmptyState } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { SERVICE_TYPES, LANGUAGES, PRICE_RANGES } from '../../config/constants';
import { formatPrice } from '../../utils/formatters';
import { searchPriests } from '../../services/firestore';
import { PriestProfile } from '../../types/user';
import { ServiceOffering } from '../../types/service';

type NavigationProp = NativeStackNavigationProp<DevoteeSearchStackParamList, 'Search'>;

interface FilterState {
  serviceType: string | null;
  priceRange: { min: number; max: number };
  distance: number;
  languages: string[];
  rating: number;
  availability: 'any' | 'today' | 'this_week' | 'this_month';
  priestType: string | null;
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance';
}

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<PriestProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  
  const [filters, setFilters] = useState<FilterState>({
    serviceType: null,
    priceRange: { min: 0, max: 1000 },
    distance: 25,
    languages: [],
    rating: 0,
    availability: 'any',
    priestType: null,
    sortBy: 'relevance',
  });

  const [recentSearches, setRecentSearches] = useState<string[]>([
    'House warming ceremony',
    'Satyanarayan Puja',
    'Tamil priests',
  ]);

  useEffect(() => {
    // Load initial results
    performSearch();
  }, []);

  useEffect(() => {
    // Count applied filters
    let count = 0;
    if (filters.serviceType) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) count++;
    if (filters.distance < 25) count++;
    if (filters.languages.length > 0) count++;
    if (filters.rating > 0) count++;
    if (filters.availability !== 'any') count++;
    if (filters.priestType) count++;
    setAppliedFiltersCount(count);
  }, [filters]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      // In real implementation, this would call the search service
      const mockResults = generateMockResults();
      
      // Apply filters
      let filtered = mockResults;
      
      if (searchQuery) {
        filtered = filtered.filter(p => 
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.priestProfile?.bio?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (filters.serviceType) {
        filtered = filtered.filter(p => 
          p.priestProfile?.services.some(s => s.serviceType === filters.serviceType)
        );
      }
      
      if (filters.languages.length > 0) {
        filtered = filtered.filter(p => 
          filters.languages.some(lang => p.priestProfile?.languages.includes(lang))
        );
      }
      
      if (filters.rating > 0) {
        filtered = filtered.filter(p => 
          (p.priestProfile?.rating.average || 0) >= filters.rating
        );
      }
      
      // Sort results
      switch (filters.sortBy) {
        case 'price_low':
          filtered.sort((a, b) => getMinPrice(a) - getMinPrice(b));
          break;
        case 'price_high':
          filtered.sort((a, b) => getMinPrice(b) - getMinPrice(a));
          break;
        case 'rating':
          filtered.sort((a, b) => 
            (b.priestProfile?.rating.average || 0) - (a.priestProfile?.rating.average || 0)
          );
          break;
        case 'distance':
          // Would sort by actual distance in real implementation
          break;
      }
      
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  const handleSearch = () => {
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)]);
    }
    performSearch();
  };

  const handlePriestPress = (priestId: string) => {
    navigation.navigate('PriestDetail', { priestId });
  };

  const handleCompare = () => {
    const selectedIds = results.slice(0, 3).map(p => p.id);
    navigation.navigate('CompareResults', { priestIds: selectedIds });
  };

  const applyFilters = () => {
    setShowFilters(false);
    performSearch();
  };

  const resetFilters = () => {
    setFilters({
      serviceType: null,
      priceRange: { min: 0, max: 1000 },
      distance: 25,
      languages: [],
      rating: 0,
      availability: 'any',
      priestType: null,
      sortBy: 'relevance',
    });
  };

  const getMinPrice = (priest: PriestProfile): number => {
    const prices = priest.priestProfile?.services
      .filter(s => s.pricingType === 'fixed')
      .map(s => s.fixedPrice || 0) || [];
    return prices.length > 0 ? Math.min(...prices) : 0;
  };

  const renderSearchHeader = () => (
    <View style={styles.searchHeader}>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search priests, services, or locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(true)}
      >
        <Ionicons name="filter" size={20} color={colors.primary} />
        {appliedFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{appliedFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRecentSearches = () => (
    <View style={styles.recentSearches}>
      <Text style={styles.sectionTitle}>Recent Searches</Text>
      <View style={styles.recentSearchItems}>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recentSearchItem}
            onPress={() => {
              setSearchQuery(search);
              handleSearch();
            }}
          >
            <Ionicons name="time-outline" size={16} color={colors.gray[500]} />
            <Text style={styles.recentSearchText}>{search}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPriestCard = ({ item }: { item: PriestProfile }) => {
    const minPrice = getMinPrice(item);
    const distance = Math.floor(Math.random() * 25) + 1; // Mock distance
    
    return (
      <Card
        onPress={() => handlePriestPress(item.id)}
        margin="small"
        style={styles.priestCard}
      >
        <View style={styles.priestCardContent}>
          <UserAvatar
            source={{ uri: item.photoURL }}
            name={`${item.firstName} ${item.lastName}`}
            size="large"
            verified={item.priestProfile?.rating.count > 10}
            title={`${item.firstName} ${item.lastName}`}
            subtitle={`${item.priestProfile?.yearsOfExperience} years experience`}
          />
          
          <View style={styles.priestDetails}>
            <View style={styles.priestStats}>
              <CompactRating
                value={item.priestProfile?.rating.average || 0}
                count={item.priestProfile?.rating.count}
                size="small"
              />
              <Text style={styles.distance}>{distance} miles away</Text>
            </View>
            
            <TagGroup
              tags={item.priestProfile?.languages.map(l => 
                LANGUAGES.find(lang => lang.code === l)?.name || l
              ) || []}
              size="small"
              maxTags={3}
              style={styles.languages}
            />
            
            <Text style={styles.bio} numberOfLines={2}>
              {item.priestProfile?.bio}
            </Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Starting from</Text>
              <Text style={styles.price}>{formatPrice(minPrice || 150)}</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.filterContent}>
          {/* Service Type */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Service Type</Text>
            <View style={styles.filterOptions}>
              {SERVICE_TYPES.map(service => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.filterOption,
                    filters.serviceType === service.id && styles.filterOptionSelected,
                  ]}
                  onPress={() => setFilters({ ...filters, serviceType: service.id })}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.serviceType === service.id && styles.filterOptionTextSelected,
                  ]}>
                    {service.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <Text style={styles.priceRangeText}>
                {formatPrice(filters.priceRange.min)} - {formatPrice(filters.priceRange.max)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1000}
                value={filters.priceRange.max}
                onValueChange={(value) => 
                  setFilters({ ...filters, priceRange: { ...filters.priceRange, max: value } })
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.gray[300]}
              />
            </View>
          </View>
          
          {/* Distance */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Distance: {filters.distance} miles</Text>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={50}
              value={filters.distance}
              onValueChange={(value) => setFilters({ ...filters, distance: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.gray[300]}
              step={5}
            />
          </View>
          
          {/* Languages */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Languages</Text>
            <View style={styles.filterOptions}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.filterOption,
                    filters.languages.includes(lang.code) && styles.filterOptionSelected,
                  ]}
                  onPress={() => {
                    const newLangs = filters.languages.includes(lang.code)
                      ? filters.languages.filter(l => l !== lang.code)
                      : [...filters.languages, lang.code];
                    setFilters({ ...filters, languages: newLangs });
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    filters.languages.includes(lang.code) && styles.filterOptionTextSelected,
                  ]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Rating */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingOptions}>
              {[0, 3, 4, 4.5].map(rating => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingOption,
                    filters.rating === rating && styles.ratingOptionSelected,
                  ]}
                  onPress={() => setFilters({ ...filters, rating })}
                >
                  <Ionicons
                    name="star"
                    size={16}
                    color={filters.rating === rating ? colors.white : colors.warning}
                  />
                  <Text style={[
                    styles.ratingOptionText,
                    filters.rating === rating && styles.ratingOptionTextSelected,
                  ]}>
                    {rating > 0 ? `${rating}+` : 'Any'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Sort By */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { value: 'relevance', label: 'Relevance' },
                { value: 'price_low', label: 'Price: Low to High' },
                { value: 'price_high', label: 'Price: High to Low' },
                { value: 'rating', label: 'Rating' },
                { value: 'distance', label: 'Distance' },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.sortOption}
                  onPress={() => setFilters({ ...filters, sortBy: option.value as any })}
                >
                  <View style={styles.radioButton}>
                    {filters.sortBy === option.value && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.sortOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.filterFooter}>
          <Button
            title="Apply Filters"
            onPress={applyFilters}
            fullWidth
            size="large"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderSearchHeader()}
      
      {loading ? (
        <PageLoader text="Searching for priests..." />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderPriestCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} priests found
              </Text>
              {results.length >= 2 && (
                <TouchableOpacity onPress={handleCompare}>
                  <Text style={styles.compareText}>Compare</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      ) : searchQuery || appliedFiltersCount > 0 ? (
        <NoResultsEmptyState
          message="Try adjusting your search or filters"
          action={{
            label: 'Clear Filters',
            onPress: () => {
              resetFilters();
              setSearchQuery('');
              performSearch();
            },
          }}
        />
      ) : (
        renderRecentSearches()
      )}
      
      {renderFiltersModal()}
    </SafeAreaView>
  );
};

// Generate mock results
const generateMockResults = (): PriestProfile[] => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `priest-${i + 1}`,
    userType: 'priest' as const,
    firstName: ['Pandit', 'Sri', 'Swami'][i % 3],
    lastName: ['Sharma', 'Kumar', 'Rao'][i % 3],
    email: `priest${i + 1}@example.com`,
    phoneNumber: '+15551234567',
    photoURL: 'https://via.placeholder.com/150',
    location: {
      zipCode: '94107',
      city: ['San Francisco', 'San Jose', 'Oakland'][i % 3],
      state: 'CA',
      coordinates: null,
    },
    priestProfile: {
      priestType: 'independent',
      templeAffiliation: null,
      yearsOfExperience: 5 + i,
      languages: ['english', 'hindi', 'sanskrit'].slice(0, (i % 3) + 1),
      certifications: ['Vedic Studies'],
      bio: 'Experienced priest specializing in all Hindu ceremonies and rituals',
      services: [
        {
          id: `service-${i}-1`,
          serviceType: SERVICE_TYPES[i % SERVICE_TYPES.length].id,
          serviceName: SERVICE_TYPES[i % SERVICE_TYPES.length].name,
          description: 'Traditional ceremony performed with dedication',
          pricingType: 'fixed',
          fixedPrice: 150 + (i * 50),
          priceRange: null,
          duration: 120,
          includedItems: ['Puja materials', 'Flowers'],
          additionalOptions: [],
          languages: ['english', 'hindi'],
          travelIncluded: true,
          maxTravelDistance: 25,
          advanceBookingRequired: 3,
          cancellationPolicy: 'flexible',
          cancellationPeriod: 24,
          isActive: true,
        },
      ],
      availability: { schedule: {}, blackoutDates: [] },
      pricing: { travelRadius: 25, additionalMileRate: 2 },
      rating: { average: 4 + (i % 10) / 10, count: 50 + i * 10 },
      totalBookings: 100 + i * 20,
      responseTime: 2,
      acceptanceRate: 90 + (i % 10),
      stripeAccountId: null,
      stripeAccountStatus: 'not_connected',
      bankAccountLast4: null,
      instantPayoutEnabled: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    fcmToken: null,
    isActive: true,
    emailVerified: true,
    phoneVerified: true,
  }));
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.medium,
    height: 40,
    marginRight: spacing.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.small,
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  filterButton: {
    position: 'relative',
    padding: spacing.small,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  recentSearches: {
    padding: spacing.large,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  recentSearchItems: {
    gap: spacing.small,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.small,
  },
  recentSearchText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginLeft: spacing.small,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  resultsCount: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  compareText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  resultsList: {
    paddingBottom: spacing.large,
  },
  priestCard: {
    marginHorizontal: spacing.medium,
  },
  priestCardContent: {
    gap: spacing.medium,
  },
  priestDetails: {
    gap: spacing.small,
  },
  priestStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  languages: {
    marginTop: spacing.xsmall,
  },
  bio: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.small,
  },
  priceLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  price: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.primary,
  },
  filterModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterTitle: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  resetText: {
    fontSize: fontSize.medium,
    color: colors.primary,
  },
  filterContent: {
    flex: 1,
  },
  filterSection: {
    padding: spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  filterSectionTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.medium,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  filterOption: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  filterOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  filterOptionTextSelected: {
    color: colors.white,
    fontWeight: '500',
  },
  priceRangeContainer: {
    gap: spacing.small,
  },
  priceRangeText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  slider: {
    height: 40,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
    gap: spacing.xsmall,
  },
  ratingOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ratingOptionText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  ratingOptionTextSelected: {
    color: colors.white,
  },
  sortOptions: {
    gap: spacing.medium,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  filterFooter: {
    padding: spacing.large,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
});