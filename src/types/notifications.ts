export type NotificationPreference = 'sms' | 'email' | 'both' | 'none';

export interface NotificationLog {
  id: string;
  user_id: string;
  message_id: string;
  notification_type: 'sms' | 'email';
  recipient_contact: string;
  status: 'sent' | 'failed' | 'pending';
  error_message: string | null;
  twilio_sid: string | null;
  created_at: string;
}

export interface ProfileNotificationSettings {
  notification_preference: NotificationPreference;
  sms_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
}

export interface NotificationPayload {
  notificationType: NotificationPreference;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientFirstName: string;
  senderFirstName: string;
  messageTimestamp: string;
  messageId: string;
  messageDuration: number;
} 