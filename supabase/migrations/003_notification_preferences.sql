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
  recipient_contact TEXT, -- phone or email
  status TEXT CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  twilio_sid TEXT, -- for tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_message_id ON notification_logs(message_id);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);

-- Enable RLS on notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON notification_logs TO authenticated;
GRANT ALL ON notification_logs TO service_role;

-- Add comment to document the feature
COMMENT ON COLUMN profiles.notification_preference IS 'User preference for notifications: sms (default), email, both, or none';
COMMENT ON COLUMN profiles.sms_notifications_enabled IS 'Whether SMS notifications are enabled for this user';
COMMENT ON COLUMN profiles.email_notifications_enabled IS 'Whether email notifications are enabled for this user';
COMMENT ON TABLE notification_logs IS 'Logs of all notification attempts for voice messages'; 