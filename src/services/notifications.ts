import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Register for push notifications
export const registerForPushNotifications = async (): Promise<string | null> => {
  let token: string | null = null;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        console.log('Project ID not found');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Push token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  return token;
};

// Save push token to user profile
export const savePushToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      pushToken: token,
      pushTokenUpdatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error saving push token:', error);
  }
};

// Schedule a local notification
export const scheduleLocalNotification = async (
  content: NotificationContent,
  trigger: Notifications.NotificationTriggerInput
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data || {},
      sound: true,
    },
    trigger,
  });
  
  return id;
};

// Send immediate local notification
export const sendLocalNotification = async (content: NotificationContent): Promise<string> => {
  return scheduleLocalNotification(content, null);
};

// Cancel a scheduled notification
export const cancelNotification = async (notificationId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Get all scheduled notifications
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return Notifications.getAllScheduledNotificationsAsync();
};

// Notification types for the app
export const NotificationTypes = {
  // Booking notifications
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BOOKING_REMINDER: 'booking_reminder',
  BOOKING_COMPLETED: 'booking_completed',
  
  // Quote notifications
  QUOTE_REQUESTED: 'quote_requested',
  QUOTE_RECEIVED: 'quote_received',
  QUOTE_ACCEPTED: 'quote_accepted',
  
  // Message notifications
  NEW_MESSAGE: 'new_message',
  
  // Payment notifications
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_RELEASED: 'payment_released',
  REFUND_PROCESSED: 'refund_processed',
  
  // Review notifications
  NEW_REVIEW: 'new_review',
  
  // System notifications
  PROFILE_INCOMPLETE: 'profile_incomplete',
  DOCUMENTS_REQUIRED: 'documents_required',
  PROMOTION: 'promotion',
} as const;

// Create notification content based on type
export const createNotificationContent = (
  type: keyof typeof NotificationTypes,
  data: Record<string, any>
): NotificationContent => {
  switch (type) {
    case 'BOOKING_CONFIRMED':
      return {
        title: '🎉 Booking Confirmed!',
        body: `Your booking with ${data.priestName} for ${data.serviceName} is confirmed.`,
        data: { type, bookingId: data.bookingId },
      };
    
    case 'BOOKING_CANCELLED':
      return {
        title: '❌ Booking Cancelled',
        body: `Your booking for ${data.serviceName} has been cancelled.`,
        data: { type, bookingId: data.bookingId },
      };
    
    case 'BOOKING_REMINDER':
      return {
        title: '⏰ Booking Reminder',
        body: `Your ${data.serviceName} service is scheduled for ${data.time}.`,
        data: { type, bookingId: data.bookingId },
      };
    
    case 'QUOTE_REQUESTED':
      return {
        title: '💰 New Quote Request',
        body: `${data.devoteeName} has requested a quote for ${data.serviceName}.`,
        data: { type, bookingId: data.bookingId },
      };
    
    case 'QUOTE_RECEIVED':
      return {
        title: '📋 Quote Received',
        body: `${data.priestName} has sent you a quote for ${data.serviceName}.`,
        data: { type, bookingId: data.bookingId },
      };
    
    case 'NEW_MESSAGE':
      return {
        title: '💬 New Message',
        body: `${data.senderName}: ${data.messagePreview}`,
        data: { type, bookingId: data.bookingId },
      };
    
    case 'PAYMENT_RECEIVED':
      return {
        title: '💳 Payment Received',
        body: `Payment of ${data.amount} received for ${data.serviceName}.`,
        data: { type, bookingId: data.bookingId },
      };
    
    case 'NEW_REVIEW':
      return {
        title: '⭐ New Review',
        body: `${data.reviewerName} left you a ${data.rating}-star review.`,
        data: { type, bookingId: data.bookingId },
      };
    
    default:
      return {
        title: 'Devebhyo Notification',
        body: 'You have a new notification.',
        data: { type },
      };
  }
};

// Schedule booking reminder
export const scheduleBookingReminder = async (
  booking: {
    id: string;
    serviceName: string;
    date: Date;
    time: string;
    priestName?: string;
    devoteeName?: string;
  },
  hoursBeforeService: number = 24
): Promise<string> => {
  const reminderDate = new Date(booking.date);
  reminderDate.setHours(reminderDate.getHours() - hoursBeforeService);
  
  const content = createNotificationContent('BOOKING_REMINDER', {
    serviceName: booking.serviceName,
    time: booking.time,
    bookingId: booking.id,
  });
  
  const trigger = { date: reminderDate };
  
  return scheduleLocalNotification(content, trigger);
};

// Add notification response listener
export const addNotificationResponseListener = (
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};

// Add notification received listener
export const addNotificationReceivedListener = (
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription => {
  return Notifications.addNotificationReceivedListener(handler);
};

// Get notification permissions status
export const getNotificationPermissions = async (): Promise<Notifications.NotificationPermissionsStatus> => {
  return Notifications.getPermissionsAsync();
};

// Set badge count (iOS)
export const setBadgeCount = async (count: number): Promise<void> => {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(count);
  }
};