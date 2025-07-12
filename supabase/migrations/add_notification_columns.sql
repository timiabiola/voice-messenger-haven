-- Add notification preference columns to profiles table if they do not exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preference text DEFAULT 'sms' CHECK (notification_preference IN ('sms', 'email', 'both', 'none')),
ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;

-- Add phone column if it does not exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text;

-- Add name columns if they do not exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Update any existing profiles to have default notification settings
UPDATE profiles 
SET 
  notification_preference = COALESCE(notification_preference, 'sms'),
  sms_notifications_enabled = COALESCE(sms_notifications_enabled, true),
  email_notifications_enabled = COALESCE(email_notifications_enabled, true)
WHERE notification_preference IS NULL 
   OR sms_notifications_enabled IS NULL 
   OR email_notifications_enabled IS NULL;
