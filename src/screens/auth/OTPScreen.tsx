import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
type RoutePropType = RouteProp<AuthStackParamList, 'OTP'>;

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60; // seconds

export const OTPScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { verificationId, phoneNumber } = route.params;
  const { confirmOTP, signInWithPhone } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start resend timer
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Focus first input
    inputRefs.current[0]?.focus();

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numeric input
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error when user starts typing
    if (error) setError('');

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === OTP_LENGTH - 1) {
      const otpString = newOtp.join('');
      if (otpString.length === OTP_LENGTH) {
        handleVerifyOTP(otpString);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await confirmOTP(verificationId, code);
      
      if (result.user) {
        // Check if user exists in database
        if (result.isNewUser) {
          navigation.navigate('UserType');
        } else {
          // User exists, navigation will be handled by AppNavigator
        }
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      
      // Handle specific error cases
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code');
      } else if (err.code === 'auth/code-expired') {
        setError('Verification code expired. Please request a new one');
      } else {
        setError('Verification failed. Please try again');
      }
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(RESEND_TIMEOUT);
    setError('');

    try {
      const result = await signInWithPhone(phoneNumber);
      if (result.verificationId) {
        // Update verificationId if needed
        Alert.alert('Success', 'Verification code sent successfully');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend code. Please try again');
      setCanResend(true);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    // Format phone number for display
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
    }
    return phone;
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
              <Ionicons name="key" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verify Your Number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={styles.phoneNumber}>
              {formatPhoneDisplay(phoneNumber)}
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : {},
                  error ? styles.otpInputError : {},
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                testID={`otp-input-${index}`}
              />
            ))}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons 
                name="alert-circle" 
                size={16} 
                color={colors.error} 
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Verify Button */}
          <Button
            title="Verify"
            onPress={() => handleVerifyOTP()}
            loading={loading}
            disabled={otp.join('').length !== OTP_LENGTH}
            fullWidth
            size="large"
            style={styles.button}
          />

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the code?{' '}
            </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>
                Resend in {resendTimer}s
              </Text>
            )}
          </View>

          {/* Change Number */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.changeNumberButton}
          >
            <Text style={styles.changeNumberText}>
              Change phone number
            </Text>
          </TouchableOpacity>
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
  },
  subtitle: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xsmall,
  },
  phoneNumber: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.large,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.medium,
    fontSize: fontSize.xlarge,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: spacing.xsmall,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  otpInputFilled: {
    borderColor: colors.primary,
  },
  otpInputError: {
    borderColor: colors.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.medium,
  },
  errorText: {
    fontSize: fontSize.small,
    color: colors.error,
    marginLeft: spacing.xsmall,
  },
  button: {
    marginBottom: spacing.xlarge,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.medium,
  },
  resendText: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  resendLink: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  resendTimer: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  changeNumberButton: {
    alignItems: 'center',
    padding: spacing.medium,
  },
  changeNumberText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});