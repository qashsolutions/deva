import React, { useState, useEffect } from 'react';
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
import { PriestProfileStackParamList } from '../../navigation/PriestNavigator';
import { Card, SectionCard } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { CompactRating } from '../../components/common/Rating';
import { ConfirmationModal } from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { colors, spacing, fontSize, borderRadius } from '../../config/theme';
import { formatPhoneNumber, formatPrice } from '../../utils/formatters';
import { APP_NAME, APP_VERSION, PRIEST_TYPES } from '../../config/constants';

type NavigationProp = NativeStackNavigationProp<PriestProfileStackParamList, 'Profile'>;

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
  const priestProfile = profile?.userType === 'priest' ? profile.priestProfile : null;

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

  const priestTypeInfo = PRIEST_TYPES.find(t => t.id === priestProfile?.priestType);

  const businessMenuItems: MenuItem[] = [
    {
      id: 'services',
      title: 'My Services',
      subtitle: `${priestProfile?.services?.length || 0} services`,
      icon: 'list',
      action: () => navigation.navigate('Services'),
      showArrow: true,
    },
    {
      id: 'availability',
      title: 'Availability Settings',
      icon: 'calendar',
      action: () => navigation.navigate('Availability'),
      showArrow: true,
    },
    {
      id: 'earnings',
      title: 'Earnings & Payouts',
      icon: 'wallet',
      action: () => navigation.navigate('Earnings'),
      showArrow: true,
      badge: priestProfile?.pendingPayouts ? formatPrice(priestProfile.pendingPayouts) : undefined,
    },
    {
      id: 'reviews',
      title: 'Reviews & Ratings',
      subtitle: `${priestProfile?.averageRating?.toFixed(1) || '0.0'} ★ (${priestProfile?.totalReviews || 0} reviews)`,
      icon: 'star',
      action: () => navigation.navigate('Reviews'),
      showArrow: true,
    },
    {
      id: 'documents',
      title: 'Documents & Verification',
      icon: 'document-text',
      action: () => navigation.navigate('Documents'),
      showArrow: true,
    },
  ];

  const supportMenuItems: MenuItem[] = [
    {
      id: 'help',
      title: 'Priest Help Center',
      icon: 'help-circle',
      action: () => Linking.openURL('https://devebhyo.com/priest-help'),
      showArrow: true,
    },
    {
      id: 'contact',
      title: 'Contact Support',
      icon: 'mail',
      action: () => Linking.openURL('mailto:priest-support@devebhyo.com'),
      showArrow: true,
    },
    {
      id: 'terms',
      title: 'Priest Terms of Service',
      icon: 'document-text',
      action: () => Linking.openURL('https://devebhyo.com/priest-terms'),
      showArrow: true,
    },
    {
      id: 'tax',
      title: 'Tax Information',
      icon: 'receipt',
      action: () => navigation.navigate('TaxInfo'),
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
      
      {priestTypeInfo && (
        <Badge label={priestTypeInfo.title} variant="primary" />
      )}
      
      <Text style={styles.userPhone}>
        {formatPhoneNumber(profile?.phoneNumber || '')}
      </Text>
      {profile?.email && (
        <Text style={styles.userEmail}>{profile.email}</Text>
      )}

      {priestProfile?.averageRating && priestProfile.averageRating > 0 && (
        <View style={styles.ratingContainer}>
          <CompactRating value={priestProfile.averageRating} size="medium" />
          <Text style={styles.ratingText}>
            ({priestProfile.totalReviews} reviews)
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </Card>
  );

  const renderBusinessInfo = () => (
    <SectionCard title="Business Information" margin="medium">
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Experience</Text>
        <Text style={styles.infoValue}>{priestProfile?.experience || 0} years</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Languages</Text>
        <Text style={styles.infoValue}>
          {priestProfile?.languages?.join(', ') || 'Not specified'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Travel Radius</Text>
        <Text style={styles.infoValue}>
          {priestProfile?.services?.[0]?.travelRadius || 0} miles
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Total Bookings</Text>
        <Text style={styles.infoValue}>{priestProfile?.totalBookings || 0}</Text>
      </View>
      
      {priestProfile?.priestType === 'temple_employee' && priestProfile.templeAffiliation && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Temple</Text>
          <Text style={styles.infoValue}>{priestProfile.templeAffiliation.name}</Text>
        </View>
      )}
    </SectionCard>
  );

  const renderNotificationSettings = () => (
    <SectionCard title="Notifications" margin="medium">
      {[
        { key: 'bookingRequests', label: 'New Booking Requests', icon: 'notifications' },
        { key: 'bookingReminders', label: 'Booking Reminders', icon: 'alarm' },
        { key: 'messages', label: 'Messages from Devotees', icon: 'chatbubble' },
        { key: 'earnings', label: 'Earnings & Payouts', icon: 'cash' },
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
            value={priestProfile?.notificationPreferences?.[setting.key as keyof typeof priestProfile.notificationPreferences] ?? true}
            onValueChange={(value) => {
              updateNotificationPreferences({
                ...priestProfile?.notificationPreferences,
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
        {renderBusinessInfo()}
        
        <SectionCard title="Business Settings" margin="medium">
          {businessMenuItems.map(renderMenuItem)}
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
          {APP_NAME} Priest v{APP_VERSION}
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
    marginBottom: spacing.small,
  },
  userPhone: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginTop: spacing.small,
  },
  userEmail: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
    marginTop: spacing.xsmall,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.medium,
    gap: spacing.small,
  },
  ratingText: {
    fontSize: fontSize.small,
    color: colors.text.secondary,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.small,
  },
  infoLabel: {
    fontSize: fontSize.medium,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: fontSize.medium,
    color: colors.text.primary,
    fontWeight: '500',
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