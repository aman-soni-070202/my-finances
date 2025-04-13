// src/services/notificationService.ts
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Navigation } from 'react-native-navigation';
import { Platform } from 'react-native';
import { PaymentInfo } from '@/types';
import { Logger } from '@/utils/logger';

// Setup notification system
export const setupNotifications = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Configure push notifications
      PushNotification.configure({
        onNotification: function (notification) {
          handleNotificationInteraction(notification);
          
          // For iOS
          if (Platform.OS === 'ios') {
            notification.finish(PushNotificationIOS.FetchResult.NoData);
          }
        },
        
        // Register notification actions
        onAction: function(notification) {
          if (notification.action === "Record Transaction") {
            handleNotificationInteraction(notification);
          }
        },
        
        // Required permissions (iOS)
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        
        popInitialNotification: true,
        requestPermissions: true,
      });
      
      // Create notification channel for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'finance-transactions',
            channelName: 'Finance Transactions',
            channelDescription: 'Notifications for finance transactions detected from SMS',
            playSound: true,
            soundName: 'default',
            importance: 4,
            vibrate: true,
          },
          (created) => Logger.debug(`Notification channel created: ${created}`)
        );
      }
      
      resolve();
    } catch (error) {
      Logger.error('Failed to setup notifications:', error);
      reject(error);
    }
  });
};

// Helper function to handle notification interaction
const handleNotificationInteraction = (notification: any): void => {
  try {
    // Safely extract payment info
    const paymentInfo = notification.userInfo?.paymentInfo;
    
    if (!paymentInfo || !paymentInfo.amount || !paymentInfo.type) {
      Logger.warn('Invalid payment info in notification:', paymentInfo);
      return;
    }
    
    // Open transaction screen with pre-filled data
    Navigation.showModal({
      stack: {
        children: [{
          component: {
            name: 'AddTransactionScreen',
            passProps: {
              prefillData: {
                amount: paymentInfo.amount,
                type: paymentInfo.type === 'credit' ? 'credit' : 'expense',
                description: `Auto-generated from SMS at ${new Date().toLocaleTimeString()}`,
              }
            },
            options: {
              topBar: {
                title: {
                  text: 'Record Transaction'
                }
              }
            }
          }
        }]
      }
    }).catch(error => {
      Logger.error('Failed to show transaction modal:', error);
    });
  } catch (error) {
    Logger.error('Error handling notification interaction:', error);
  }
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  return text.length > maxLength 
    ? `${text.substring(0, maxLength)}...` 
    : text;
};

// Show notification with transaction details
export const showTransactionNotification = (paymentInfo: PaymentInfo): void => {
  try {
    if (!paymentInfo) {
      Logger.warn('Attempted to show notification with invalid payment info');
      return;
    }
    
    PushNotification.localNotification({
      channelId: 'finance-transactions',
      title: `${paymentInfo.type === 'credit' ? 'Amount Received' : 'Payment Made'}: ₹${paymentInfo.amount}`,
      message: truncateText(paymentInfo.rawMessage),
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      // When clicked, open the transaction screen with pre-filled data
      userInfo: { paymentInfo },
      // Custom expanded view
      bigText: paymentInfo.rawMessage,
      // Add action button to record transaction
      actions: ["Record Transaction"]
    });
  } catch (error) {
    Logger.error('Failed to show transaction notification:', error);
  }
};

// Cleanup function to unregister notification listeners
export const cleanupNotifications = (): void => {
  PushNotification.unregister();
};