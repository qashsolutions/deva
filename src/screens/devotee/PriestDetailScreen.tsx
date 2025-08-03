import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import { DevoteeSearchStackParamList } from '../../navigation/DevoteeNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Badge, StatusBadge, TagGroup } from '../../components/common/Badge';
import { Rating, RatingStats } from '../../components/common/Rating';
import { Button, OutlineButton, IconButton } from '../../components/common/Button';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { SERVICE_TYPES, LANGUAGES } from '../../config/constants';
import { formatPrice, formatPhoneNumber } from '../../utils/formatters';
import { getPriestById } from '../../services/firestore';
import { PriestProfile } from '../../types/user';
import { ServiceOffering } from '../../types/service';

type NavigationProp = NativeStackNavigationProp<DevoteeSearchStackParamList, 'PriestDetail'>;
type RoutePropType = RouteProp<DevoteeSearchStackParamList, 'PriestDetail'>;

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: Date;
  comment: string;
  serviceName: string;
}

export const PriestDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { priestId } = route.params;
  const { state: userState, toggleFavoritePriest } = useUser();
  
  const [priest, setPriest] = useState<PriestProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Mock data
  const reviews: Review[] = [
    {
      id: '1',
      userName: 'Priya Patel',
      rating: 5,
      date: new Date('2024-01-15'),
      comment: 'Panditji performed our house warming ceremony beautifully. Very knowledgeable and patient with all our questions.',
      serviceName: 'Griha Pravesh',
    },
    {
      id: '2',
      userName: 'Raj Kumar',
      rating: 4,
      date: new Date('2024-01-10'),
      comment: 'Good experience overall. The puja was conducted well, though he arrived a bit late.',
      serviceName: 'Satyanarayan Puja',
    },
  ];

  const ratingDistribution = {
    5: 120,
    4: 45,
    3: 15,
    2: 5,
    1: 2,
  };

  useEffect(() => {
    loadPriestDetails();
  }, [priestId]);

  useEffect(() => {
    setIsFavorite(
      userState.profile?.userType === 'devotee' &&
      userState.profile.devoteeProfile?.favoritePriests.includes(priestId)
    );
  }, [userState.profile, priestId]);

  const loadPriestDetails = async () => {
    try {
      // In real implementation, this would fetch from Firestore
      const mockPriest: PriestProfile = {
        id: priestId,
        userType: 'priest',
        firstName: 'Pandit',
        lastName: 'Sharma',
        email: 'sharma@example.com',
        phoneNumber: '+14155551234',
        photoURL: 'https://via.placeholder.com/300',
        location: {
          zipCode: '94107',
          city: 'San Francisco',
          state: 'CA',
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
        },
        priestProfile: {
          priestType: 'independent',
          templeAffiliation: 'Sri Venkateswara Temple',
          yearsOfExperience: 15,
          languages: ['english', 'hindi', 'sanskrit', 'telugu'],
          certifications: ['Vedic Studies', 'Astrology', 'Sanskrit Scholar'],
          bio: 'Experienced priest with over 15 years of performing traditional Hindu ceremonies. Specializing in weddings, house warmings, and all major pujas. I believe in making our sacred traditions accessible and meaningful for modern families.',
          services: [
            {
              id: 'service-1',
              serviceType: 'griha_pravesh',
              serviceName: 'Griha Pravesh (House Warming)',
              description: 'Traditional house warming ceremony to bring prosperity and remove negative energies from your new home.',
              pricingType: 'fixed',
              fixedPrice: 250,
              priceRange: null,
              duration: 120,
              includedItems: ['All puja materials', 'Flowers', 'Prasad', 'Havan materials'],
              additionalOptions: [
                { name: 'Extended Havan', price: 50 },
                { name: 'Ganapati Puja', price: 75 },
              ],
              languages: ['english', 'hindi', 'telugu'],
              travelIncluded: true,
              maxTravelDistance: 25,
              advanceBookingRequired: 3,
              cancellationPolicy: 'moderate',
              cancellationPeriod: 48,
              isActive: true,
            },
            {
              id: 'service-2',
              serviceType: 'satyanarayan_puja',
              serviceName: 'Satyanarayan Puja',
              description: 'Sacred puja for Lord Vishnu to seek blessings for prosperity and well-being.',
              pricingType: 'fixed',
              fixedPrice: 200,
              priceRange: null,
              duration: 90,
              includedItems: ['Puja materials', 'Prasad ingredients', 'Flowers'],
              additionalOptions: [],
              languages: ['english', 'hindi'],
              travelIncluded: true,
              maxTravelDistance: 25,
              advanceBookingRequired: 2,
              cancellationPolicy: 'flexible',
              cancellationPeriod: 24,
              isActive: true,
            },
          ],
          availability: {
            schedule: {
              monday: [{ start: '09:00', end: '18:00' }],
              tuesday: [{ start: '09:00', end: '18:00' }],
              wednesday: [{ start: '09:00', end: '18:00' }],
              thursday: [{ start: '09:00', end: '18:00' }],
              friday: [{ start: '09:00', end: '18:00' }],
              saturday: [{ start: '08:00', end: '20:00' }],
              sunday: [{ start: '08:00', end: '20:00' }],
            },
            blackoutDates: [],
          },
          pricing: {
            travelRadius: 25,
            additionalMileRate: 2,
          },
          rating: {
            average: 4.8,
            count: 187,
          },
          totalBookings: 350,
          responseTime: 2,
          acceptanceRate: 95,
          stripeAccountId: 'acct_123',
          stripeAccountStatus: 'active',
          bankAccountLast4: '4567',
          instantPayoutEnabled: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        fcmToken: null,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
      };
      
      setPriest(mockPriest);
      setSelectedService(mockPriest.priestProfile?.services[0] || null);
    } catch (error) {
      console.error('Failed to load priest details:', error);
      Alert.alert('Error', 'Failed to load priest details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = () => {
    if (!selectedService) return;
    
    navigation.navigate('BookingFlow', {
      priestId: priest!.id,
      serviceId: selectedService.id,
    });
  };

  const handleCall = () => {
    if (priest?.phoneNumber) {
      Linking.openURL(`tel:${priest.phoneNumber}`);
    }
  };

  const handleMessage = () => {
    // In real app, this would open in-app messaging
    Alert.alert('Coming Soon', 'In-app messaging will be available soon!');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${priest?.firstName} ${priest?.lastName} on Devebhyo - ${priest?.priestProfile?.bio}`,
        title: 'Share Priest Profile',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavoritePriest(priestId);
      setIsFavorite(!isFavorite);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  if (loading) {
    return <PageLoader text="Loading priest details..." />;
  }

  if (!priest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Priest not found</Text>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Image
        source={{ uri: priest.photoURL }}
        style={styles.coverImage}
        resizeMode="cover"
      />
      <View style={styles.headerOverlay} />
      
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <IconButton
            icon={<Ionicons name="share-outline" size={24} color={colors.white} />}
            onPress={handleShare}
            variant="ghost"
            accessibilityLabel="Share"
          />
          <IconButton
            icon={
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? colors.error : colors.white}
              />
            }
            onPress={handleToggleFavorite}
            variant="ghost"
            accessibilityLabel="Toggle favorite"
          />
        </View>
      </View>
      
      <View style={styles.profileInfo}>
        <Avatar
          source={{ uri: priest.photoURL }}
          name={`${priest.firstName} ${priest.lastName}`}
          size="xlarge"
          verified={priest.priestProfile?.rating.count > 50}
          style={styles.avatar}
        />
        <Text style={styles.name}>
          {priest.firstName} {priest.lastName}
        </Text>
        <Text style={styles.location}>
          {priest.location.city}, {priest.location.state}
        </Text>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {priest.priestProfile?.yearsOfExperience}+
            </Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {priest.priestProfile?.totalBookings}
            </Text>
            <Text style={styles.statLabel}>Ceremonies</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {priest.priestProfile?.acceptanceRate}%
            </Text>
            <Text style={styles.statLabel}>Acceptance</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAbout = () => (
    <SectionCard title="About" margin="medium">
      <Text style={styles.bio}>{priest.priestProfile?.bio}</Text>
      
      <View style={styles.infoRow}>
        <Ionicons name="business" size={20} color={colors.gray[600]} />
        <Text style={styles.infoText}>
          {priest.priestProfile?.templeAffiliation || 'Independent Priest'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Ionicons name="language" size={20} color={colors.gray[600]} />
        <View style={styles.languagesList}>
          <TagGroup
            tags={priest.priestProfile?.languages.map(l =>
              LANGUAGES.find(lang => lang.code === l)?.name || l
            ) || []}
            size="small"
            variant="neutral"
          />
        </View>
      </View>
      
      {priest.priestProfile?.certifications && priest.priestProfile.certifications.length > 0 && (
        <View style={styles.infoRow}>
          <Ionicons name="ribbon" size={20} color={colors.gray[600]} />
          <View style={styles.languagesList}>
            <TagGroup
              tags={priest.priestProfile.certifications}
              size="small"
              variant="info"
            />
          </View>
        </View>
      )}
    </SectionCard>
  );

  const renderServices = () => {
    const services = priest.priestProfile?.services || [];
    const displayServices = showAllServices ? services : services.slice(0, 2);
    
    return (
      <SectionCard
        title="Services Offered"
        subtitle={`${services.length} services`}
        margin="medium"
      >
        {displayServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.serviceCard,
              selectedService?.id === service.id && styles.serviceCardSelected,
            ]}
            onPress={() => setSelectedService(service)}
          >
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.serviceName}</Text>
                <Text style={styles.servicePrice}>
                  {service.pricingType === 'fixed'
                    ? formatPrice(service.fixedPrice!)
                    : service.pricingType === 'range'
                    ? `${formatPrice(service.priceRange!.min)} - ${formatPrice(service.priceRange!.max)}`
                    : 'Quote on request'}
                </Text>
              </View>
              {selectedService?.id === service.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </View>
            
            <Text style={styles.serviceDescription} numberOfLines={2}>
              {service.description}
            </Text>
            
            <View style={styles.serviceDetails}>
              <View style={styles.serviceDetail}>
                <Ionicons name="time-outline" size={16} color={colors.gray[600]} />
                <Text style={styles.serviceDetailText}>
                  {service.duration} mins
                </Text>
              </View>
              <View style={styles.serviceDetail}>
                <Ionicons name="car-outline" size={16} color={colors.gray[600]} />
                <Text style={styles.serviceDetailText}>
                  Travel included ({service.maxTravelDistance} mi)
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        
        {services.length > 2 && (
          <TouchableOpacity
            onPress={() => setShowAllServices(!showAllServices)}
            style={styles.showMoreButton}
          >
            <Text style={styles.showMoreText}>
              {showAllServices ? 'Show Less' : `Show All ${services.length} Services`}
            </Text>
            <Ionicons
              name={showAllServices ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </SectionCard>
    );
  };

  const renderReviews = () => {
    const displayReviews = showAllReviews ? reviews : reviews.slice(0, 2);
    
    return (
      <SectionCard title="Reviews & Ratings" margin="medium">
        <RatingStats
          averageRating={priest.priestProfile?.rating.average || 0}
          totalCount={priest.priestProfile?.rating.count || 0}
          distribution={ratingDistribution}
        />
        
        <View style={styles.reviewsList}>
          {displayReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Avatar
                  source={review.userAvatar ? { uri: review.userAvatar } : undefined}
                  name={review.userName}
                  size="small"
                />
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewerName}>{review.userName}</Text>
                  <View style={styles.reviewMeta}>
                    <Rating value={review.rating} size="small" readonly />
                    <Text style={styles.reviewDate}>
                      {review.date.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
              
              <Badge
                label={review.serviceName}
                size="small"
                variant="neutral"
                style={styles.reviewService}
              />
              
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>
        
        {reviews.length > 2 && (
          <TouchableOpacity
            onPress={() => setShowAllReviews(!showAllReviews)}
            style={styles.showMoreButton}
          >
            <Text style={styles.showMoreText}>
              {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
            </Text>
            <Ionicons
              name={showAllReviews ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </SectionCard>
    );
  };

  const renderLocation = () => (
    <SectionCard title="Service Area" margin="medium">
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: priest.location.coordinates?.latitude || 37.7749,
          longitude: priest.location.coordinates?.longitude || -122.4194,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        {priest.location.coordinates && (
          <>
            <Marker coordinate={priest.location.coordinates} />
            <Circle
              center={priest.location.coordinates}
              radius={priest.priestProfile?.pricing.travelRadius * 1609.34} // miles to meters
              fillColor="rgba(99, 102, 241, 0.1)"
              strokeColor="rgba(99, 102, 241, 0.3)"
              strokeWidth={1}
            />
          </>
        )}
      </MapView>
      
      <Text style={styles.serviceAreaText}>
        Services available within {priest.priestProfile?.pricing.travelRadius} miles of{' '}
        {priest.location.city}, {priest.location.state}
      </Text>
      
      {priest.priestProfile?.pricing.additionalMileRate && (
        <Text style={styles.additionalMileText}>
          Additional travel: {formatPrice(priest.priestProfile.pricing.additionalMileRate)}/mile
        </Text>
      )}
    </SectionCard>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <View>
          <Text style={styles.footerLabel}>Starting from</Text>
          <Text style={styles.footerPrice}>
            {selectedService && selectedService.pricingType === 'fixed'
              ? formatPrice(selectedService.fixedPrice!)
              : formatPrice(150)}
          </Text>
        </View>
        <View style={styles.footerButtons}>
          <OutlineButton
            title="Message"
            icon={<Ionicons name="chatbubble-outline" size={20} color={colors.primary} />}
            onPress={handleMessage}
            size="medium"
            style={styles.messageButton}
          />
          <Button
            title="Book Now"
            onPress={handleBookService}
            size="medium"
            style={styles.bookButton}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderAbout()}
        {renderServices()}
        {renderReviews()}
        {renderLocation()}
      </ScrollView>
      {renderFooter()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.large,
  },
  backButton: {
    padding: spacing.small,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: spacing.large,
  },
  avatar: {
    borderWidth: 3,
    borderColor: colors.white,
  },
  name: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.medium,
  },
  location: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginTop: spacing.xsmall,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.large,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.large,
  },
  statValue: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xsmall,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray[300],
  },
  bio: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.5,
    marginBottom: spacing.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.medium,
  },
  infoText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginLeft: spacing.small,
    flex: 1,
  },
  languagesList: {
    flex: 1,
    marginLeft: spacing.small,
  },
  serviceCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  servicePrice: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
  serviceDescription: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
    marginBottom: spacing.small,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: spacing.large,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  serviceDetailText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.small,
    gap: spacing.xsmall,
  },
  showMoreText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  reviewsList: {
    marginTop: spacing.large,
  },
  reviewCard: {
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.small,
  },
  reviewInfo: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  reviewerName: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    marginTop: spacing.xsmall,
  },
  reviewDate: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  reviewService: {
    alignSelf: 'flex-start',
    marginBottom: spacing.small,
  },
  reviewComment: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    lineHeight: fontSize.medium * 1.4,
  },
  map: {
    height: 200,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.medium,
  },
  serviceAreaText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  additionalMileText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xsmall,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    paddingBottom: spacing.large,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  footerPrice: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  messageButton: {
    minWidth: 100,
  },
  bookButton: {
    minWidth: 120,
  },
});