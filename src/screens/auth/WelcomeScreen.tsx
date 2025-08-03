import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button, PrimaryButton } from '../../components/common/Button';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { APP_NAME } from '../../config/constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // Preload next screen assets if needed
  }, []);

  const features = [
    {
      icon: 'search' as const,
      title: 'Find Qualified Priests',
      description: 'Search priests by location, language, and ceremony type',
    },
    {
      icon: 'calendar' as const,
      title: 'Easy Booking',
      description: 'Book ceremonies at your convenience with instant confirmation',
    },
    {
      icon: 'shield-checkmark' as const,
      title: 'Verified Priests',
      description: 'All priests are verified for authenticity and expertise',
    },
    {
      icon: 'card' as const,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with multiple options',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primary + 'CC']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and App Name */}
          <View style={styles.logoContainer}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="flower" size={60} color={colors.white} />
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.tagline}>
              Connecting Devotees with Qualified Hindu Priests
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <Ionicons
                    name={feature.icon}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA Buttons */}
          <View style={styles.ctaContainer}>
            <PrimaryButton
              title="Get Started"
              size="large"
              fullWidth
              onPress={() => navigation.navigate('PhoneAuth')}
              style={styles.primaryButton}
            />
            
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <Button
              title="Join as a Priest"
              variant="outline"
              size="large"
              fullWidth
              onPress={() => navigation.navigate('PhoneAuth')}
              style={styles.secondaryButton}
            />
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.xlarge,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.05,
    marginBottom: spacing.xlarge,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.medium,
  },
  appName: {
    fontSize: fontSize.xxxlarge,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.small,
  },
  tagline: {
    fontSize: fontSize.medium,
    color: colors.white + 'CC',
    textAlign: 'center',
    paddingHorizontal: spacing.large,
  },
  featuresContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    marginVertical: spacing.xlarge,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: spacing.large,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  featureDescription: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    lineHeight: fontSize.small * 1.4,
  },
  ctaContainer: {
    marginBottom: spacing.xlarge,
  },
  primaryButton: {
    backgroundColor: colors.white,
    marginBottom: spacing.medium,
  },
  secondaryButton: {
    borderColor: colors.white,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.medium,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.white + '40',
  },
  orText: {
    color: colors.white,
    fontSize: fontSize.small,
    marginHorizontal: spacing.medium,
  },
  terms: {
    fontSize: fontSize.xsmall,
    color: colors.white + 'CC',
    textAlign: 'center',
    lineHeight: fontSize.xsmall * 1.5,
  },
  termsLink: {
    color: colors.white,
    textDecorationLine: 'underline',
  },
});