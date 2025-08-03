import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/common/Button';
import { PhoneInput } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { validatePhoneNumber, formatPhoneNumber } from '../../utils/validation';
import { APP_NAME } from '../../config/constants';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PhoneAuth'>;

export const PhoneAuthScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signInWithPhone } = useAuth();
  const phoneInputRef = useRef<TextInput>(null);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1'); // Default US
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    
    // Validate phone number
    const validation = validatePhoneNumber(fullPhoneNumber);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid phone number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signInWithPhone(fullPhoneNumber);
      
      if (result.verificationId) {
        navigation.navigate('OTP', {
          verificationId: result.verificationId,
          phoneNumber: fullPhoneNumber,
        });
      }
    } catch (err: any) {
      console.error('Phone auth error:', err);
      
      // Handle specific error cases
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS quota exceeded. Please try again later');
      } else {
        setError('Failed to send verification code. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    setPhoneNumber(cleaned);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="call" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Enter Your Phone Number</Text>
            <Text style={styles.subtitle}>
              We'll send you a verification code to confirm your number
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryCodeLabel}>Country</Text>
                <View style={styles.countryCodeSelector}>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={20} 
                    color={colors.text.secondary} 
                  />
                </View>
              </View>

              <View style={styles.phoneNumberContainer}>
                <PhoneInput
                  ref={phoneInputRef}
                  label="Phone Number"
                  placeholder="(555) 123-4567"
                  value={formatPhoneNumber(phoneNumber)}
                  onChangeText={handlePhoneNumberChange}
                  error={error}
                  keyboardType="phone-pad"
                  maxLength={14} // Formatted length
                  autoFocus
                />
              </View>
            </View>

            <Button
              title="Send Verification Code"
              onPress={handleSendOTP}
              loading={loading}
              disabled={phoneNumber.length < 10}
              fullWidth
              size="large"
              style={styles.button}
            />

            {/* Info */}
            <View style={styles.infoContainer}>
              <Ionicons 
                name="information-circle-outline" 
                size={16} 
                color={colors.text.secondary} 
              />
              <Text style={styles.infoText}>
                Standard messaging rates may apply
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to {APP_NAME}'s
            </Text>
            <View style={styles.footerLinks}>
              <Text style={styles.footerLink}>Terms of Service</Text>
              <Text style={styles.footerText}> and </Text>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </View>
          </View>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.large,
  },
  title: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.large,
    lineHeight: fontSize.medium * 1.5,
  },
  form: {
    flex: 1,
    marginBottom: spacing.xlarge,
  },
  phoneInputContainer: {
    marginBottom: spacing.xlarge,
  },
  countryCodeContainer: {
    marginBottom: spacing.medium,
  },
  countryCodeLabel: {
    fontSize: fontSize.small,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  countryCodeText: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  phoneNumberContainer: {
    flex: 1,
  },
  button: {
    marginBottom: spacing.medium,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small,
  },
  infoText: {
    fontSize: fontSize.xsmall,
    color: colors.text.secondary,
    marginLeft: spacing.xsmall,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: fontSize.small,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});