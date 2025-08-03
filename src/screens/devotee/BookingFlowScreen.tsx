import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DevoteeSearchStackParamList } from '../../navigation/DevoteeNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Button, OutlineButton } from '../../components/common/Button';
import { Input, TextArea } from '../../components/common/Input';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { StepIndicator } from '../../components/common/StepIndicator';
import { useBooking } from '../../contexts/BookingContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPrice, formatDate } from '../../utils/formatters';
import { getAvailableSlots } from '../../utils/dateUtils';
import { PriestProfile } from '../../types/user';
import { ServiceOffering } from '../../types/service';
import { BookingRequest } from '../../types/booking';

type NavigationProp = NativeStackNavigationProp<DevoteeSearchStackParamList, 'BookingFlow'>;
type RoutePropType = RouteProp<DevoteeSearchStackParamList, 'BookingFlow'>;

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => (
  <View style={stepStyles.container}>
    {steps.map((step, index) => (
      <View key={index} style={stepStyles.stepContainer}>
        <View style={stepStyles.stepWrapper}>
          <View
            style={[
              stepStyles.step,
              index < currentStep && stepStyles.stepCompleted,
              index === currentStep && stepStyles.stepActive,
            ]}
          >
            {index < currentStep ? (
              <Ionicons name="checkmark" size={16} color={colors.white} />
            ) : (
              <Text
                style={[
                  stepStyles.stepNumber,
                  index === currentStep && stepStyles.stepNumberActive,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={[
              stepStyles.stepLabel,
              index === currentStep && stepStyles.stepLabelActive,
            ]}
          >
            {step}
          </Text>
        </View>
        {index < steps.length - 1 && (
          <View
            style={[
              stepStyles.connector,
              index < currentStep && stepStyles.connectorCompleted,
            ]}
          />
        )}
      </View>
    ))}
  </View>
);

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.large,
  },
  stepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepWrapper: {
    alignItems: 'center',
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xsmall,
  },
  stepCompleted: {
    backgroundColor: colors.success,
  },
  stepActive: {
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.gray[600],
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLabel: {
    fontSize: fontSize.xsmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.gray[300],
    marginHorizontal: spacing.xsmall,
    marginBottom: spacing.large,
  },
  connectorCompleted: {
    backgroundColor: colors.success,
  },
});

export const BookingFlowScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { priestId, serviceId } = route.params;
  const { createBookingRequest } = useBooking();
  const { state: userState } = useUser();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [priest, setPriest] = useState<PriestProfile | null>(null);
  const [service, setService] = useState<ServiceOffering | null>(null);

  // Step 1: Date & Time
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Step 2: Location
  const [locationType, setLocationType] = useState<'home' | 'temple' | 'other'>('home');
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [customAddress, setCustomAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Step 3: Additional Details
  const [additionalOptions, setAdditionalOptions] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [attendeeCount, setAttendeeCount] = useState('10');

  const steps = ['Date & Time', 'Location', 'Details', 'Review'];

  useEffect(() => {
    loadBookingData();
  }, [priestId, serviceId]);

  useEffect(() => {
    // Load available slots when date changes
    if (priest && selectedDate) {
      const slots = getAvailableSlots(
        selectedDate,
        priest.priestProfile?.availability.schedule || {},
        [] // Would pass existing bookings in real implementation
      );
      setAvailableSlots(slots);
      if (slots.length > 0 && !selectedTime) {
        setSelectedTime(slots[0]);
      }
    }
  }, [selectedDate, priest]);

  const loadBookingData = async () => {
    try {
      // In real implementation, would fetch from Firestore
      const mockPriest: PriestProfile = {
        id: priestId,
        userType: 'priest',
        firstName: 'Pandit',
        lastName: 'Sharma',
        email: 'sharma@example.com',
        phoneNumber: '+14155551234',
        photoURL: 'https://via.placeholder.com/150',
        location: {
          zipCode: '94107',
          city: 'San Francisco',
          state: 'CA',
          coordinates: null,
        },
        priestProfile: {
          priestType: 'independent',
          templeAffiliation: null,
          yearsOfExperience: 15,
          languages: ['english', 'hindi'],
          certifications: [],
          bio: 'Experienced priest',
          services: [
            {
              id: serviceId || 'service-1',
              serviceType: 'griha_pravesh',
              serviceName: 'Griha Pravesh (House Warming)',
              description: 'Traditional house warming ceremony',
              pricingType: 'fixed',
              fixedPrice: 250,
              priceRange: null,
              duration: 120,
              includedItems: ['All puja materials', 'Flowers', 'Prasad'],
              additionalOptions: [
                { name: 'Extended Havan', price: 50 },
                { name: 'Ganapati Puja', price: 75 },
              ],
              languages: ['english', 'hindi'],
              travelIncluded: true,
              maxTravelDistance: 25,
              advanceBookingRequired: 3,
              cancellationPolicy: 'moderate',
              cancellationPeriod: 48,
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
          pricing: { travelRadius: 25, additionalMileRate: 2 },
          rating: { average: 4.8, count: 187 },
          totalBookings: 350,
          responseTime: 2,
          acceptanceRate: 95,
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
      };

      setPriest(mockPriest);
      const selectedService = mockPriest.priestProfile?.services.find(s => s.id === serviceId);
      setService(selectedService || mockPriest.priestProfile?.services[0] || null);

      // Set default address
      if (userState.profile?.userType === 'devotee') {
        const addresses = userState.profile.devoteeProfile?.savedAddresses || [];
        if (addresses.length > 0) {
          setSelectedAddress(addresses[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load booking data:', error);
      Alert.alert('Error', 'Failed to load booking information');
    }
  };

  const calculateTotal = () => {
    if (!service) return 0;
    
    let total = service.fixedPrice || 0;
    
    // Add selected options
    additionalOptions.forEach(optionName => {
      const option = service.additionalOptions?.find(o => o.name === optionName);
      if (option) {
        total += option.price;
      }
    });
    
    return total;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleNext = () => {
    // Validate current step
    switch (currentStep) {
      case 0: // Date & Time
        if (!selectedDate || !selectedTime) {
          Alert.alert('Error', 'Please select date and time');
          return;
        }
        break;
      case 1: // Location
        if (locationType === 'other' && !isAddressComplete()) {
          Alert.alert('Error', 'Please enter complete address');
          return;
        }
        if (!selectedAddress && locationType === 'home') {
          Alert.alert('Error', 'Please select or add an address');
          return;
        }
        break;
      case 2: // Details
        if (!attendeeCount || parseInt(attendeeCount) < 1) {
          Alert.alert('Error', 'Please enter valid number of attendees');
          return;
        }
        break;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const isAddressComplete = () => {
    return (
      customAddress.street &&
      customAddress.city &&
      customAddress.state &&
      customAddress.zipCode
    );
  };

  const handleSubmit = async () => {
    if (!priest || !service) return;
    
    setLoading(true);
    
    try {
      const bookingData: Partial<BookingRequest> = {
        priestId: priest.id,
        serviceId: service.id,
        serviceName: service.serviceName,
        serviceType: service.serviceType,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        duration: service.duration,
        location: locationType === 'other'
          ? {
              type: 'other',
              address: `${customAddress.street}, ${customAddress.city}, ${customAddress.state} ${customAddress.zipCode}`,
              city: customAddress.city,
              state: customAddress.state,
              zipCode: customAddress.zipCode,
            }
          : {
              type: locationType,
              address: selectedAddress?.address || '',
              city: selectedAddress?.city || '',
              state: selectedAddress?.state || '',
              zipCode: selectedAddress?.zipCode || '',
            },
        attendeeCount: parseInt(attendeeCount),
        additionalOptions,
        specialRequests,
        basePrice: service.fixedPrice || 0,
        additionalCharges: additionalOptions.reduce((sum, optionName) => {
          const option = service.additionalOptions?.find(o => o.name === optionName);
          return sum + (option?.price || 0);
        }, 0),
        totalAmount: calculateTotal(),
        status: 'pending',
      };
      
      const bookingId = await createBookingRequest(bookingData as BookingRequest);
      
      // Navigate to payment screen
      navigation.navigate('Payment', {
        bookingId,
        amount: calculateTotal(),
      });
    } catch (error) {
      console.error('Booking creation error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderDateTimeStep();
      case 1:
        return renderLocationStep();
      case 2:
        return renderDetailsStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderDateTimeStep = () => (
    <View style={styles.stepContent}>
      <SectionCard title="Select Date" margin="medium">
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <Text style={styles.dateSelectorText}>
            {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
        
        <Text style={styles.advanceBookingNote}>
          <Ionicons name="information-circle" size={16} color={colors.info} />
          {' '}Minimum {service?.advanceBookingRequired} days advance booking required
        </Text>
      </SectionCard>
      
      <SectionCard title="Select Time" margin="medium">
        <View style={styles.timeSlots}>
          {availableSlots.length > 0 ? (
            availableSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.timeSlot,
                  selectedTime === slot && styles.timeSlotSelected,
                ]}
                onPress={() => setSelectedTime(slot)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === slot && styles.timeSlotTextSelected,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noSlotsText}>
              No available slots for this date. Please select another date.
            </Text>
          )}
        </View>
        
        <Text style={styles.durationNote}>
          <Ionicons name="time" size={16} color={colors.gray[600]} />
          {' '}Estimated duration: {service?.duration} minutes
        </Text>
      </SectionCard>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <SectionCard title="Ceremony Location" margin="medium">
        <View style={styles.locationTypes}>
          {[
            { type: 'home', label: 'My Home', icon: 'home' },
            { type: 'temple', label: 'Temple', icon: 'business' },
            { type: 'other', label: 'Other Location', icon: 'location' },
          ].map((location) => (
            <TouchableOpacity
              key={location.type}
              style={[
                styles.locationType,
                locationType === location.type && styles.locationTypeSelected,
              ]}
              onPress={() => setLocationType(location.type as any)}
            >
              <Ionicons
                name={location.icon as any}
                size={24}
                color={locationType === location.type ? colors.primary : colors.gray[600]}
              />
              <Text
                style={[
                  styles.locationTypeText,
                  locationType === location.type && styles.locationTypeTextSelected,
                ]}
              >
                {location.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>
      
      {locationType === 'home' && (
        <SectionCard title="Select Address" margin="medium">
          {userState.profile?.userType === 'devotee' &&
          userState.profile.devoteeProfile?.savedAddresses.length > 0 ? (
            userState.profile.devoteeProfile.savedAddresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.savedAddress,
                  selectedAddress?.id === address.id && styles.savedAddressSelected,
                ]}
                onPress={() => setSelectedAddress(address)}
              >
                <View style={styles.savedAddressContent}>
                  <Text style={styles.savedAddressLabel}>{address.label}</Text>
                  <Text style={styles.savedAddressText}>{address.address}</Text>
                  <Text style={styles.savedAddressText}>
                    {address.city}, {address.state} {address.zipCode}
                  </Text>
                </View>
                {selectedAddress?.id === address.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noAddressText}>
              No saved addresses. Please add a new address.
            </Text>
          )}
        </SectionCard>
      )}
      
      {locationType === 'other' && (
        <SectionCard title="Enter Address" margin="medium">
          <Input
            label="Street Address"
            value={customAddress.street}
            onChangeText={(text) => setCustomAddress({ ...customAddress, street: text })}
            placeholder="123 Main St"
            required
          />
          <Input
            label="City"
            value={customAddress.city}
            onChangeText={(text) => setCustomAddress({ ...customAddress, city: text })}
            placeholder="San Francisco"
            required
          />
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Input
                label="State"
                value={customAddress.state}
                onChangeText={(text) => setCustomAddress({ ...customAddress, state: text })}
                placeholder="CA"
                maxLength={2}
                autoCapitalize="characters"
                required
              />
            </View>
            <View style={styles.halfWidth}>
              <Input
                label="ZIP Code"
                value={customAddress.zipCode}
                onChangeText={(text) => setCustomAddress({ ...customAddress, zipCode: text })}
                placeholder="94107"
                keyboardType="numeric"
                maxLength={5}
                required
              />
            </View>
          </View>
        </SectionCard>
      )}
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <SectionCard title="Number of Attendees" margin="medium">
        <Input
          value={attendeeCount}
          onChangeText={setAttendeeCount}
          keyboardType="numeric"
          placeholder="10"
          leftIcon="people"
        />
      </SectionCard>
      
      {service?.additionalOptions && service.additionalOptions.length > 0 && (
        <SectionCard title="Additional Services" margin="medium">
          {service.additionalOptions.map((option) => (
            <TouchableOpacity
              key={option.name}
              style={styles.additionalOption}
              onPress={() => {
                if (additionalOptions.includes(option.name)) {
                  setAdditionalOptions(additionalOptions.filter(o => o !== option.name));
                } else {
                  setAdditionalOptions([...additionalOptions, option.name]);
                }
              }}
            >
              <View style={styles.additionalOptionContent}>
                <View style={styles.checkbox}>
                  {additionalOptions.includes(option.name) && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </View>
                <View style={styles.additionalOptionInfo}>
                  <Text style={styles.additionalOptionName}>{option.name}</Text>
                  <Text style={styles.additionalOptionPrice}>
                    +{formatPrice(option.price)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </SectionCard>
      )}
      
      <SectionCard title="Special Requests (Optional)" margin="medium">
        <TextArea
          value={specialRequests}
          onChangeText={setSpecialRequests}
          placeholder="Any special requirements or preferences..."
          maxLength={500}
          numberOfLines={4}
        />
      </SectionCard>
    </View>
  );

  const renderReviewStep = () => {
    const locationText = locationType === 'home'
      ? selectedAddress?.address
      : locationType === 'temple'
      ? 'Temple (To be specified)'
      : `${customAddress.street}, ${customAddress.city}, ${customAddress.state} ${customAddress.zipCode}`;
    
    return (
      <View style={styles.stepContent}>
        <SectionCard title="Booking Summary" margin="medium">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{service?.serviceName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Priest</Text>
            <Text style={styles.summaryValue}>
              {priest?.firstName} {priest?.lastName}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date & Time</Text>
            <Text style={styles.summaryValue}>
              {formatDate(selectedDate, 'MMM d, yyyy')} at {selectedTime}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Location</Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {locationText}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Attendees</Text>
            <Text style={styles.summaryValue}>{attendeeCount} people</Text>
          </View>
          
          {additionalOptions.length > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Additional Services</Text>
              <Text style={styles.summaryValue}>
                {additionalOptions.join(', ')}
              </Text>
            </View>
          )}
        </SectionCard>
        
        <SectionCard title="Price Breakdown" margin="medium">
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Service</Text>
            <Text style={styles.priceValue}>
              {formatPrice(service?.fixedPrice || 0)}
            </Text>
          </View>
          
          {additionalOptions.map((optionName) => {
            const option = service?.additionalOptions?.find(o => o.name === optionName);
            return (
              <View key={optionName} style={styles.priceRow}>
                <Text style={styles.priceLabel}>{optionName}</Text>
                <Text style={styles.priceValue}>
                  +{formatPrice(option?.price || 0)}
                </Text>
              </View>
            );
          })}
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(calculateTotal())}</Text>
          </View>
        </SectionCard>
        
        <View style={styles.cancellationPolicy}>
          <Ionicons name="information-circle" size={20} color={colors.warning} />
          <Text style={styles.cancellationPolicyText}>
            {service?.cancellationPolicy === 'flexible'
              ? 'Free cancellation up to 24 hours before the ceremony'
              : service?.cancellationPolicy === 'moderate'
              ? 'Free cancellation up to 48 hours before the ceremony'
              : '50% refund if cancelled 72 hours before the ceremony'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Service</Text>
          <View style={styles.placeholder} />
        </View>
        
        <StepIndicator currentStep={currentStep} steps={steps} />
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>
        
        <View style={styles.footer}>
          <OutlineButton
            title="Back"
            onPress={handleBack}
            style={styles.footerButton}
          />
          <Button
            title={currentStep === steps.length - 1 ? 'Proceed to Payment' : 'Next'}
            onPress={handleNext}
            loading={loading}
            style={styles.footerButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
    paddingBottom: spacing.large,
  },
  stepContent: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  dateSelectorText: {
    flex: 1,
    marginLeft: spacing.medium,
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  advanceBookingNote: {
    fontSize: fontSize.small,
    color: colors.info,
    marginTop: spacing.small,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xsmall,
  },
  timeSlot: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    margin: spacing.xsmall,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  timeSlotTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  noSlotsText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.large,
  },
  durationNote: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.medium,
  },
  locationTypes: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xsmall,
  },
  locationType: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.medium,
    margin: spacing.xsmall,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  locationTypeSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  locationTypeText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xsmall,
  },
  locationTypeTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  savedAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    marginBottom: spacing.small,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  savedAddressSelected: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  savedAddressContent: {
    flex: 1,
  },
  savedAddressLabel: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  savedAddressText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  noAddressText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.large,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.small,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: spacing.small,
  },
  additionalOption: {
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  additionalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.small,
    borderWidth: 2,
    borderColor: colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  additionalOptionInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalOptionName: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  additionalOptionPrice: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.small,
  },
  summaryLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  summaryValue: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.small,
  },
  priceLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  priceValue: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing.small,
    paddingTop: spacing.medium,
  },
  totalLabel: {
    fontSize: fontSize.large,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
  },
  cancellationPolicy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warning + '10',
    padding: spacing.medium,
    marginHorizontal: spacing.medium,
    marginTop: spacing.small,
    borderRadius: borderRadius.medium,
  },
  cancellationPolicyText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginLeft: spacing.small,
    lineHeight: fontSize.small * 1.4,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.large,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
    gap: spacing.medium,
  },
  footerButton: {
    flex: 1,
  },
});