// src/services/smsService.ts
import BackgroundActions from 'react-native-background-actions';
import SmsRetriever from 'react-native-sms-retriever';
import { Platform } from 'react-native';
import { showTransactionNotification } from './notificationService';
import { PaymentInfo } from '@/types';

const backgroundOptions = {
  taskName: 'SMS Monitor',
  taskTitle: 'Finance SMS Monitor',
  taskDesc: 'Monitoring SMS for financial transactions',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  parameters: {
    delay: 5000, // Check every 5 seconds (adjust as needed)
  },
};

// Track SMS listener to properly remove it later
let smsListenerActive = false;
// Check if SMS Retriever is available
const isSmsRetrieverAvailable = (): boolean => {
  return Platform.OS === 'android' && SmsRetriever !== null && SmsRetriever !== undefined;
};

// SMS monitoring background task
const smsMonitoringTask = async (taskDataArguments?: { delay: number }): Promise<void> => {
  // Use default delay if taskDataArguments is undefined
  const delay = taskDataArguments?.delay || 5000;

  // Keep the service running
  await new Promise<void>(async (resolve) => {
    // Start SMS listener
    try {
      // Only attempt to register SMS retriever if it's available and not already active
      if (!smsListenerActive && isSmsRetrieverAvailable()) {
        try {
          const registered = await SmsRetriever.startSmsRetriever();
          if (registered) {
            smsListenerActive = true;
            SmsRetriever.addSmsListener((event: { message?: string }) => {
              const { message } = event;

              if (message) {
                // Parse the message to extract payment information
                const paymentInfo = parsePaymentSMS(message);

                if (paymentInfo) {
                  // Show notification with transaction details
                  showTransactionNotification(paymentInfo);
                }
              } else {
                console.log('No message!');
              }
            });
          }
        } catch (smsError: any) {
          console.error('SMS Retriever operation failed:', smsError);
          // If we get an error specifically about requestPhoneNumber being null
          if (smsError.toString().includes('requestPhoneNumber')) {
            console.error('SMS Retriever API not available on this device or missing permissions');
          }
        }
      }
    } catch (error) {
      console.error('SMS Retriever Error:', error);
    }

    // This function needs to run indefinitely, but we should handle the task properly
    const interval = setInterval(() => {
      // Keep alive logic
      console.log('SMS monitoring service running...');
    }, delay);

    // This will help with cleanup if the task is somehow terminated
    return () => {
      clearInterval(interval);
      if (smsListenerActive && isSmsRetrieverAvailable()) {
        try {
          SmsRetriever.removeSmsListener();
          smsListenerActive = false;
        } catch (error) {
          console.error('Failed to remove SMS listener:', error);
        }
      }
    };
  });
};

// Parse SMS to extract payment information
export const parsePaymentSMS = (message: string): PaymentInfo | null => {
  // Regular expressions to identify different types of payment SMS
  const patterns = {
    // Credit pattern - improved to catch more variations
    credit: /(?:credited|received|added|deposited|cr)[^0-9]*(?:Rs\.?|INR|₹)\s*([0-9,. ]+)/i,

    // Debit pattern - improved to catch more variations
    debit: /(?:debited|paid|spent|payment|transaction|dr)[^0-9]*(?:Rs\.?|INR|₹)\s*([0-9,. ]+)/i,

    // Balance pattern (optional)
    balance: /(?:(?:avl|available|current|net|closing)?\s*(?:balance|bal))[^0-9]*(?:Rs\.?|INR|₹)\s*([0-9,. ]+)/i,

    // Account number (optional) - improved to match different formats
    account: /(?:a\/c|acct|account|ac)(?:[^0-9]*|[^0-9]*x+|[^0-9]*\*+)([0-9x\*]{4,})/i,
    
    // Merchant name (optional)
    merchant: /(?:at|to|@|toward|shop|merchant)\s+([A-Za-z0-9\s]+?)(?:on|for|via|using|[0-9]|\.|\s{2,}|$)/i
  };

  let paymentInfo: PaymentInfo = {
    type: null,
    amount: null,
    balance: null,
    account: null,
    merchant: null,
    rawMessage: message,
    timestamp: new Date().toISOString()
  };

  // Try to match credit pattern
  const creditMatch = message.match(patterns.credit);
  if (creditMatch) {
    paymentInfo.type = 'credit';
    paymentInfo.amount = parseFloat(creditMatch[1].replace(/[,\s]/g, ''));
  } else {
    // Try to match debit pattern
    const debitMatch = message.match(patterns.debit);
    if (debitMatch) {
      paymentInfo.type = 'debit';
      paymentInfo.amount = parseFloat(debitMatch[1].replace(/[,\s]/g, ''));
    }
  }

  // Extract balance if available
  const balanceMatch = message.match(patterns.balance);
  if (balanceMatch) {
    paymentInfo.balance = parseFloat(balanceMatch[1].replace(/[,\s]/g, ''));
  }

  // Extract account if available
  const accountMatch = message.match(patterns.account);
  if (accountMatch) {
    paymentInfo.account = accountMatch[1];
  }
  
  // Extract merchant if available
  const merchantMatch = message.match(patterns.merchant);
  if (merchantMatch) {
    paymentInfo.merchant = merchantMatch[1].trim();
  }

  // Return null if no payment information found
  if (!paymentInfo.type || !paymentInfo.amount) {
    return null;
  }

  return paymentInfo;
};

// Start SMS monitoring service
export const startSmsMonitoring = async (): Promise<void> => {
  try {
    // Check if platform supports SMS Retriever
    if (!isSmsRetrieverAvailable()) {
      console.log('SMS Retriever is not available on this platform');
      throw new Error('SMS Retriever is only available on Android devices');
    }
    
    if (await checkSmsMonitoringStatus()) {
      console.log('SMS monitoring service is already running');
      return;
    }
    
    await BackgroundActions.start(smsMonitoringTask, backgroundOptions);
    console.log('Background service started successfully');
  } catch (error) {
    console.error('Failed to start background service:', error);
    throw error;
  }
};

// Stop SMS monitoring service
export const stopSmsMonitoring = async (): Promise<void> => {
  try {
    if (await checkSmsMonitoringStatus()) {
      await BackgroundActions.stop();
      
      // Ensure SMS listener is removed
      if (smsListenerActive && isSmsRetrieverAvailable()) {
        try {
          SmsRetriever.removeSmsListener();
          smsListenerActive = false;
        } catch (listenerError) {
          console.error('Failed to remove SMS listener:', listenerError);
        }
      }
      
      console.log('Background service stopped');
    } else {
      console.log('No active SMS monitoring service to stop');
    }
  } catch (error) {
    console.error('Failed to stop background service:', error);
    throw error;
  }
};

// Check if SMS monitoring service is running
export const checkSmsMonitoringStatus = async (): Promise<boolean> => {
  try {
    return await BackgroundActions.isRunning();
  } catch (error) {
    console.error('Failed to check background service status:', error);
    return false;
  }
};