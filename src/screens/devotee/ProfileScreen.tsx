import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DevoteeProfileStackParamList } from '../../navigation/DevoteeNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { ConfirmationModal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPhoneNumber } from '../../utils/formatters';
import { APP_NAME, APP_VERSION } from '../../config/constants';

type NavigationProp = NativeStackNavigationProp<DevoteeProfileStackParamList, 'Profile'>;

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  showArrow?: boolean;
  badge?: string;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signOut } = useAuth();
  const { state: userState, updateNotificationPreferences } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const profile = userState.profile;
  const devoteeProfile = profile?.userType === 'devotee' ? profile.devoteeProfile : null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // In real app, would upload to Firebase Storage and update profile
      Alert.alert('Success', 'Profile photo updated');
    }
  };

  const accountMenuItems: MenuItem[] = [
    {
      id: 'addresses',
      title: 'Saved Addresses',
      subtitle: `${devoteeProfile?.savedAddresses.length || 0} addresses`,
      icon: 'location',
      action: () => navigation.navigate('SavedAddresses'),
      showArrow: true,
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      icon: 'card',
      action: () => navigation.navigate('PaymentMethods'),
      showArrow: true,
    },
    {
      id: 'favorites',
      title: 'Favorite Priests',
      subtitle: `${devoteeProfile?.favoritePriests.length || 0} priests`,
      icon: 'heart',
      action: () => navigation.navigate('FavoritePriests'),
      showArrow: true,
    },
    {
      id: 'loyalty',
      title: 'Loyalty Credits',
      subtitle: `${devoteeProfile?.loyaltyPoints || 0} points`,
      icon: 'gift',
      action: () => navigation.navigate('LoyaltyCredits'),
      showArrow: true,
      badge: devoteeProfile?.loyaltyPoints > 0 ? `$${(devoteeProfile.loyaltyPoints / 100).toFixed(2)}` : undefined,
    },
  ];

  const supportMenuItems: MenuItem[] = [
    {
      id: 'help',
      title: 'Help Center',
      icon: 'help-circle',
      action: () => Linking.openURL('https://devebhyo.com/help'),
      showArrow: true,
    },
    {
      id: 'contact',
      title: 'Contact Support',
      icon: 'mail',
      action: () => Linking.openURL('mailto:support@devebhyo.com'),
      showArrow: true,
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'document-text',
      action: () => Linking.openURL('https://devebhyo.com/terms'),
      showArrow: true,
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-checkmark',
      action: () => Linking.openURL('https://devebhyo.com/privacy'),
      showArrow: true,
    },
  ];

  const renderProfileHeader = () => (
    <Card margin="medium" style={styles.profileCard}>
      <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarContainer}>
        <Avatar
          source={profile?.photoURL ? { uri: profile.photoURL } : undefined}
          name={`${profile?.firstName} ${profile?.lastName}`}
          size="xlarge"
        />
        <View style={styles.cameraIcon}>
          <Ionicons name="camera" size={20} color={colors.white} />
        </View>
      </TouchableOpacity>

      <Text style={styles.userName}>
        {profile?.firstName} {profile?.lastName}
      </Text>
      <Text style={styles.userPhone}>
        {formatPhoneNumber(profile?.phoneNumber || '')}
      </Text>
      {profile?.email && (
        <Text style={styles.userEmail}>{profile.email}</Text>
      )}

      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      {devoteeProfile?.referralCode && (
        <View style={styles.referralContainer}>
          <Text style={styles.referralLabel}>Your Referral Code</Text>
          <View style={styles.referralCode}>
            <Text style={styles.referralCodeText}>{devoteeProfile.referralCode}</Text>
            <TouchableOpacity
              onPress={() => {
                // Copy to clipboard functionality
                Alert.alert('Copied!', 'Referral code copied to clipboard');
              }}
            >
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );

  const renderNotificationSettings = () => (
    <SectionCard title="Notifications" margin="medium">
      {[
        { key: 'bookingUpdates', label: 'Booking Updates', icon: 'calendar' },
        { key: 'messages', label: 'Messages', icon: 'chatbubble' },
        { key: 'promotions', label: 'Promotions & Offers', icon: 'pricetag' },
        { key: 'reminders', label: 'Ceremony Reminders', icon: 'alarm' },
      ].map((setting) => (
        <View key={setting.key} style={styles.notificationRow}>
          <View style={styles.notificationInfo}>
            <Ionicons
              name={setting.icon as any}
              size={20}
              color={colors.gray[600]}
              style={styles.notificationIcon}
            />
            <Text style={styles.notificationLabel}>{setting.label}</Text>
          </View>
          <Switch
            value={devoteeProfile?.notificationPreferences[setting.key as keyof typeof devoteeProfile.notificationPreferences] || false}
            onValueChange={(value) => {
              updateNotificationPreferences({
                ...devoteeProfile?.notificationPreferences,
                [setting.key]: value,
              });
            }}
            trackColor={{ false: colors.gray[300], true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      ))}
    </SectionCard>
  );

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.action}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuItemIcon}>
          <Ionicons name={item.icon} size={24} color={colors.gray[600]} />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <Badge label={item.badge} size="small" variant="primary" />
        )}
        {item.showArrow && (
          <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        
        <SectionCard title="Account" margin="medium">
          {accountMenuItems.map(renderMenuItem)}
        </SectionCard>

        {renderNotificationSettings()}

        <SectionCard title="Support" margin="medium">
          {supportMenuItems.map(renderMenuItem)}
        </SectionCard>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          {APP_NAME} v{APP_VERSION}
        </Text>
      </ScrollView>

      <ConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out?"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        confirmButtonProps={{ loading: loggingOut }}
        danger
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xlarge,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.xlarge,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.medium,
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
  userName: {
    fontSize: fontSize.xlarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  userPhone: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  userEmail: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginTop: spacing.xsmall,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.small,
    marginTop: spacing.medium,
    gap: spacing.small,
  },
  editButtonText: {
    fontSize: fontSize.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  referralContainer: {
    alignItems: 'center',
    marginTop: spacing.large,
    paddingTop: spacing.large,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    width: '100%',
  },
  referralLabel: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginBottom: spacing.small,
  },
  referralCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    gap: spacing.small,
  },
  referralCodeText: {
    fontSize: fontSize.medium,
    fontWeight: '600',
    color: colors.text.primary,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    marginRight: spacing.medium,
  },
  notificationLabel: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    marginBottom: spacing.xsmall,
  },
  menuItemSubtitle: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    marginHorizontal: spacing.medium,
    marginTop: spacing.large,
    gap: spacing.small,
  },
  logoutText: {
    fontSize: fontSize.medium,
    color: colors.error,
    fontWeight: '600',
  },
  version: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.large,
  },
});