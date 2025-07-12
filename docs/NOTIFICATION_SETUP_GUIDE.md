# Quick Setup Guide: Voice Message Notifications

## Prerequisites

1. Supabase project with Edge Functions enabled
2. n8n instance (self-hosted or cloud)
3. Twilio account with:
   - SMS capabilities
   - SendGrid API key for email

## Step 1: Apply Database Migrations

Run these SQL scripts in your Supabase SQL editor:

1. **First Migration** (`003_notification_preferences.sql`):
```sql
-- Add notification preferences to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS 
  notification_preference TEXT DEFAULT 'sms' CHECK (notification_preference IN ('sms', 'email', 'both', 'none')),
  sms_notifications_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true;

-- Create notification log table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES voice_messages(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN ('sms', 'email')),
  recipient_contact TEXT,
  status TEXT CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  twilio_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes and RLS policies
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_message_id ON notification_logs(message_id);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

GRANT SELECT ON notification_logs TO authenticated;
GRANT ALL ON notification_logs TO service_role;
```

2. **Second Migration** (`004_notification_trigger.sql`):
```sql
-- Note: This trigger requires pg_net extension or alternative approach
-- For production, use Supabase Database Webhooks instead:
-- 1. Go to Database > Webhooks in Supabase Dashboard
-- 2. Create new webhook
-- 3. Set table: voice_messages
-- 4. Set events: INSERT
-- 5. Set URL: https://your-project.supabase.co/functions/v1/voice-message-notification
```

## Step 2: Deploy Edge Function

1. **Deploy the function**:
```bash
supabase functions deploy voice-message-notification
```

2. **Set environment variables**:
```bash
supabase secrets set N8N_WEBHOOK_URL="https://your-n8n.com/webhook/xxx"
supabase secrets set N8N_AUTH_TOKEN="your-secret-token"
supabase secrets set APP_BASE_URL="https://your-app.com"
```

## Step 3: Configure n8n Workflow

1. **Import this workflow template**:
```json
{
  "name": "Voice Message Notifications",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "authentication": "headerAuth",
        "headerAuth": {
          "name": "Authorization",
          "value": "Bearer your-secret-token"
        },
        "path": "voice-notifications",
        "responseMode": "onReceived",
        "responseData": "allEntries"
      }
    },
    {
      "name": "Router",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "dataType": "string",
        "value1": "={{$json.notificationType}}",
        "rules": {
          "rules": [
            {"value2": "sms"},
            {"value2": "email"},
            {"value2": "both"}
          ]
        }
      }
    },
    {
      "name": "Send SMS",
      "type": "n8n-nodes-base.twilio",
      "parameters": {
        "operation": "sms:send",
        "from": "+1234567890",
        "to": "={{$json.recipientPhone}}",
        "message": "Hi {{$json.recipientFirstName}}, you have a new voice message from {{$json.senderFirstName}} ({{$json.messageDuration}}). Listen now: {{$json.appUrl}}"
      }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.sendGrid",
      "parameters": {
        "operation": "send",
        "to": "={{$json.recipientEmail}}",
        "subject": "New voice message from {{$json.senderFirstName}}",
        "html": "<h2>Hi {{$json.recipientFirstName}},</h2><p>You have a new voice message from {{$json.senderFirstName}}.</p><p><strong>Duration:</strong> {{$json.messageDuration}}<br><strong>Received:</strong> {{$json.messageTimestamp}}</p><p><a href='{{$json.appUrl}}' style='background:#3b82f6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;'>Listen to Message</a></p>"
      }
    }
  ]
}
```

2. **Configure Twilio credentials**:
   - Add Twilio Account SID
   - Add Twilio Auth Token
   - Set your Twilio phone number

3. **Configure SendGrid**:
   - Add SendGrid API Key
   - Set from email address

## Step 4: Set Up Database Webhook

1. Go to Supabase Dashboard > Database > Webhooks
2. Click "Create a new webhook"
3. Configure:
   - **Name**: Voice Message Notifications
   - **Table**: voice_messages
   - **Events**: INSERT
   - **URL**: `https://your-project.supabase.co/functions/v1/voice-message-notification`
   - **Headers**: Add any required auth headers

## Step 5: Test the System

1. **Update a test user's profile**:
```sql
UPDATE profiles 
SET phone = '+1234567890',
    notification_preference = 'sms'
WHERE id = 'test-user-id';
```

2. **Send a test voice message** to the user

3. **Check logs**:
```bash
supabase functions logs voice-message-notification
```

4. **Verify notification received**

## Troubleshooting Checklist

- [ ] Database migrations applied successfully
- [ ] Edge function deployed and accessible
- [ ] Environment variables set correctly
- [ ] n8n workflow active and webhook accessible
- [ ] Database webhook configured and enabled
- [ ] User has valid phone/email in profile
- [ ] User's notification preference is not 'none'
- [ ] Twilio/SendGrid credentials valid

## Common Issues

1. **"N8N_WEBHOOK_URL not configured"**
   - Set the environment variable: `supabase secrets set N8N_WEBHOOK_URL="..."`

2. **No notifications sent**
   - Check if database webhook is triggering
   - Verify edge function logs for errors
   - Ensure user has contact info

3. **SMS/Email delivery failures**
   - Verify Twilio/SendGrid credentials
   - Check n8n workflow execution logs
   - Ensure phone numbers include country code

## Next Steps

1. Monitor notification delivery rates
2. Set up error alerting
3. Implement rate limiting
4. Add analytics tracking
5. Consider adding more notification channels 