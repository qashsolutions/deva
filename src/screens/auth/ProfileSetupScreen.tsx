import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/common/Button';
import { Input, TextArea } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { validateEmail, validateName } from '../../utils/validation';
import { LANGUAGES } from '../../config/constants';
import { UserProfile, PriestProfile, DevoteeProfile, PriestType } from '../../types/user';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;
type RoutePropType = RouteProp<AuthStackParamList, 'ProfileSetup'>;

export const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { userType, priestType } = route.params;
  const { state: authState } = useAuth();
  const { createProfile } = useUser();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUri, setImageUri] = useState<string>('');

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [bio, setBio] = useState('');

  // Priest-specific fields
  const [templeAffiliation, setTempleAffiliation] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [languages, setLanguages] = useState<string[]>(['english']);
  const [certifications, setCertifications] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate common fields
    const firstNameValidation = validateName(firstName);
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error || 'Invalid first name';
    }

    const lastNameValidation = validateName(lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error || 'Invalid last name';
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || 'Invalid email';
    }

    if (!zipCode || zipCode.length !== 5) {
      newErrors.zipCode = 'Please enter a valid 5-digit ZIP code';
    }

    // Validate priest-specific fields
    if (userType === 'priest') {
      if (!templeAffiliation && priestType !== 'independent') {
        newErrors.templeAffiliation = 'Temple affiliation is required';
      }

      if (!yearsOfExperience || parseInt(yearsOfExperience) < 0) {
        newErrors.yearsOfExperience = 'Please enter valid years of experience';
      }

      if (languages.length === 0) {
        newErrors.languages = 'Please select at least one language';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setLoading(true);

    try {
      const baseProfile = {
        firstName,
        lastName,
        email,
        phoneNumber: authState.userData?.phoneNumber || '',
        photoURL: imageUri,
        location: {
          zipCode,
          city: '', // Will be populated from ZIP code
          state: '', // Will be populated from ZIP code
          coordinates: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        fcmToken: null,
        isActive: true,
        emailVerified: false,
        phoneVerified: true,
      };

      let profileData: UserProfile;

      if (userType === 'priest') {
        const priestProfile: PriestProfile = {
          ...baseProfile,
          id: authState.userData?.id || '',
          userType: 'priest',
          priestProfile: {
            priestType: priestType as PriestType,
            templeAffiliation: priestType === 'independent' ? null : templeAffiliation,
            yearsOfExperience: parseInt(yearsOfExperience),
            languages,
            certifications: certifications.split(',').map(cert => cert.trim()).filter(Boolean),
            bio,
            services: [],
            availability: {
              schedule: {},
              blackoutDates: [],
            },
            pricing: {
              travelRadius: 25,
              additionalMileRate: 2,
            },
            rating: {
              average: 0,
              count: 0,
            },
            totalBookings: 0,
            responseTime: 0,
            acceptanceRate: 0,
            stripeAccountId: null,
            stripeAccountStatus: 'not_connected',
            bankAccountLast4: null,
            instantPayoutEnabled: false,
            businessDetails: priestType === 'temple_owner' ? {
              businessName: templeAffiliation,
              taxId: null,
              businessAddress: null,
            } : undefined,
          },
        };
        profileData = priestProfile;
      } else {
        const devoteeProfile: DevoteeProfile = {
          ...baseProfile,
          id: authState.userData?.id || '',
          userType: 'devotee',
          devoteeProfile: {
            preferredLanguages: ['english'],
            savedAddresses: [],
            favoritePriests: [],
            recentSearches: [],
            notificationPreferences: {
              bookingUpdates: true,
              promotions: true,
              reminders: true,
              messages: true,
            },
            loyaltyPoints: 0,
            referralCode: `DEV${Date.now().toString(36).toUpperCase()}`,
            referredBy: null,
          },
        };
        profileData = devoteeProfile;
      }

      await createProfile(profileData);
      
      // Navigation will be handled by AppNavigator based on auth state
    } catch (error) {
      console.error('Profile creation error:', error);
      Alert.alert(
        'Error',
        'Failed to create profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (language: string) => {
    setLanguages(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Help us know you better
            </Text>
          </View>

          {/* Profile Picture */}
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            <Avatar
              source={imageUri ? { uri: imageUri } : undefined}
              name={`${firstName} ${lastName}`}
              size="xlarge"
            />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color={colors.white} />
            </View>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Fields */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  error={errors.firstName}
                  required
                />
              </View>
              <View style={styles.halfWidth}>
                <Input
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  error={errors.lastName}
                  required
                />
              </View>
            </View>

            {/* Email */}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />

            {/* ZIP Code */}
            <Input
              label="ZIP Code"
              value={zipCode}
              onChangeText={setZipCode}
              error={errors.zipCode}
              keyboardType="numeric"
              maxLength={5}
              required
            />

            {/* Priest-specific fields */}
            {userType === 'priest' && (
              <>
                {/* Temple Affiliation */}
                {priestType !== 'independent' && (
                  <Input
                    label="Temple Name"
                    value={templeAffiliation}
                    onChangeText={setTempleAffiliation}
                    error={errors.templeAffiliation}
                    placeholder="Enter your temple name"
                    required
                  />
                )}

                {/* Years of Experience */}
                <Input
                  label="Years of Experience"
                  value={yearsOfExperience}
                  onChangeText={setYearsOfExperience}
                  error={errors.yearsOfExperience}
                  keyboardType="numeric"
                  placeholder="0"
                  required
                />

                {/* Languages */}
                <View style={styles.languagesSection}>
                  <Text style={styles.languagesLabel}>
                    Languages Spoken <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <View style={styles.languagesGrid}>
                    {LANGUAGES.map(lang => (
                      <TouchableOpacity
                        key={lang.code}
                        style={[
                          styles.languageChip,
                          languages.includes(lang.code) && styles.languageChipSelected,
                        ]}
                        onPress={() => toggleLanguage(lang.code)}
                      >
                        <Text style={[
                          styles.languageChipText,
                          languages.includes(lang.code) && styles.languageChipTextSelected,
                        ]}>
                          {lang.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.languages && (
                    <Text style={styles.errorText}>{errors.languages}</Text>
                  )}
                </View>

                {/* Certifications */}
                <Input
                  label="Certifications (Optional)"
                  value={certifications}
                  onChangeText={setCertifications}
                  placeholder="e.g., Vedic Astrology, Sanskrit Scholar"
                  hint="Separate multiple certifications with commas"
                />

                {/* Bio */}
                <TextArea
                  label="About Me"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell devotees about your experience and expertise..."
                  maxLength={500}
                  numberOfLines={4}
                />
              </>
            )}
          </View>

          {/* Submit Button */}
          <Button
            title="Complete Setup"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            size="large"
            style={styles.button}
          />
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
  keyboardView: {
    flex: 1,
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
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: spacing.xlarge,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  form: {
    marginBottom: spacing.xlarge,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.small,
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: spacing.small,
  },
  languagesSection: {
    marginVertical: spacing.small,
  },
  languagesLabel: {
    fontSize: fontSize.small,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xsmall,
  },
  languageChip: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
    margin: spacing.xsmall,
  },
  languageChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageChipText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  languageChipTextSelected: {
    color: colors.white,
    fontWeight: '500',
  },
  errorText: {
    fontSize: fontSize.xsmall,
    color: colors.error,
    marginTop: spacing.xsmall,
  },
  button: {
    marginBottom: spacing.medium,
  },
});