# Voice Message Notification System Documentation

## Overview

The Voice Message Notification System sends SMS or email notifications to users when they receive new voice messages. Users can configure their notification preferences through the Settings page.

## Features

- **Dual-channel notifications**: SMS (default) or Email
- **User preferences**: Choose between SMS, Email, Both, or None
- **Smart fallback**: Automatically falls back to email if SMS preferred but no phone number
- **Mountain Time conversion**: All timestamps converted to MST/MDT
- **Delivery tracking**: All notification attempts are logged
- **Real-time processing**: Notifications sent immediately upon message receipt

## System Architecture

### Components

1. **Database Schema**
   - Profile columns for notification preferences
   - Notification logs table for tracking delivery

2. **Edge Function** (`voice-message-notification`)
   - Triggered by database webhook on new voice messages
   - Fetches recipient preferences and contact info
   - Sends notification payload to n8n

3. **n8n Workflow**
   - Receives webhook from edge function
   - Routes to appropriate channel (SMS/Email)
   - Handles Twilio SMS and SendGrid email delivery

4. **Frontend Settings**
   - User-friendly interface for managing preferences
   - Real-time validation of contact information

## Database Schema

### Profile Table Additions
```sql
notification_preference TEXT DEFAULT 'sms' -- 'sms', 'email', 'both', 'none'
sms_notifications_enabled BOOLEAN DEFAULT true
email_notifications_enabled BOOLEAN DEFAULT true
```

### Notification Logs Table
```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  message_id UUID REFERENCES voice_messages(id),
  notification_type TEXT, -- 'sms' or 'email'
  recipient_contact TEXT,
  status TEXT, -- 'sent', 'failed', 'pending'
  error_message TEXT,
  twilio_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE
);
```

## Edge Function Setup

### Environment Variables Required
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `N8N_WEBHOOK_URL`: n8n webhook endpoint
- `N8N_AUTH_TOKEN`: Authentication token for n8n (optional)
- `APP_BASE_URL`: Base URL of your application

### Deployment
```bash
supabase functions deploy voice-message-notification
```

### Set Secrets
```bash
supabase secrets set N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/xxx
supabase secrets set N8N_AUTH_TOKEN=your-auth-token
supabase secrets set APP_BASE_URL=https://your-app.com
```

## n8n Workflow Configuration

### Webhook Node
- **Authentication**: Bearer Token (if using N8N_AUTH_TOKEN)
- **HTTP Method**: POST
- **Response**: Return success/failure status

### Workflow Structure
1. **Webhook Trigger**: Receives notification payload
2. **Router**: Routes based on `notificationType`
3. **SMS Branch**: 
   - Twilio SMS node
   - Format: "Hi {firstName}, you have a new voice message from {senderName} ({duration}). Listen now: {shortLink}"
4. **Email Branch**:
   - SendGrid node
   - HTML template with branding
5. **Error Handling**: Catch and log failures

### Payload Structure
```json
{
  "notificationType": "sms|email|both",
  "recipientPhone": "+1234567890",
  "recipientEmail": "user@example.com",
  "recipientFirstName": "John",
  "senderFirstName": "Jane",
  "messageTimestamp": "Jan 15, 2:30 PM MST",
  "messageId": "uuid",
  "messageDuration": "45s",
  "appUrl": "https://app.com/inbox?message=uuid"
}
```

## User Guide

### Setting Notification Preferences

1. Navigate to Settings (click Settings icon in header or sidebar)
2. Scroll to "Notification Preferences" section
3. Choose your preferred notification method:
   - **SMS Text Message** (default): Instant notifications via text
   - **Email**: Notifications sent to your email
   - **Both SMS & Email**: Receive on both channels
   - **No Notifications**: Disable all notifications

4. Toggle individual channels on/off as needed
5. Click "Save" to apply changes

### Requirements
- For SMS: Valid phone number with country code
- For Email: Valid email address
- Both can be updated in Profile Information section

## Troubleshooting

### Common Issues

1. **Not receiving SMS notifications**
   - Verify phone number includes country code (+1 for US/Canada)
   - Check if SMS notifications are enabled
   - Ensure notification preference includes SMS

2. **Not receiving email notifications**
   - Verify email address is correct
   - Check spam/junk folder
   - Ensure email notifications are enabled

3. **Notifications delayed**
   - Check n8n workflow status
   - Verify edge function is deployed
   - Check Supabase function logs

### Checking Logs

**Edge Function Logs**:
```bash
supabase functions logs voice-message-notification
```

**Database Notification Logs**:
```sql
SELECT * FROM notification_logs 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;
```

## Testing

### Manual Testing
1. Create test user with phone/email
2. Set notification preferences
3. Send voice message to test user
4. Verify notification received
5. Check notification_logs table

### Test Scenarios
- SMS only with valid phone
- Email only with valid email
- Both channels enabled
- No phone number (should fallback to email)
- No email (SMS only should still work)
- Notifications disabled

## Security Considerations

1. **Data Protection**
   - Phone numbers and emails masked in logs
   - HTTPS required for all communication
   - Authentication tokens for webhook endpoints

2. **Rate Limiting**
   - Implement per-user limits to prevent abuse
   - Monitor for unusual activity

3. **Privacy**
   - Users can disable notifications anytime
   - Notification logs accessible only to user
   - Support for unsubscribe/STOP commands

## Future Enhancements

1. **Additional Channels**
   - WhatsApp notifications
   - Push notifications for mobile app
   - Slack/Teams integration

2. **Advanced Features**
   - Quiet hours/DND settings
   - Notification grouping/batching
   - Custom notification sounds
   - Rich media previews

3. **Analytics**
   - Delivery success rates
   - User engagement metrics
   - Cost analysis per channel

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Contact support with:
   - User ID
   - Message ID
   - Timestamp of issue
   - Error messages (if any) 