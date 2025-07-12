-- COMPLETE FIX FOR PROFILES TABLE
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_preference text DEFAULT 'sms' CHECK (notification_preference IN ('sms', 'email', 'both', 'none')),
ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Step 2: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;
DROP POLICY IF EXISTS "Enable all operations for users on their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON profiles;

-- Step 4: Create new policies
CREATE POLICY "Enable all operations for users on their own profile"
ON profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Step 5: Grant permissions
GRANT ALL ON profiles TO authenticated;

-- Step 6: Create profiles for any existing users
INSERT INTO profiles (id, email, created_at, updated_at, notification_preference, sms_notifications_enabled, email_notifications_enabled)
SELECT 
    id,
    email,
    COALESCE(created_at, NOW()),
    NOW(),
    'sms',
    true,
    true
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Update existing profiles with default notification settings
UPDATE profiles 
SET 
  notification_preference = COALESCE(notification_preference, 'sms'),
  sms_notifications_enabled = COALESCE(sms_notifications_enabled, true),
  email_notifications_enabled = COALESCE(email_notifications_enabled, true)
WHERE notification_preference IS NULL 
   OR sms_notifications_enabled IS NULL 
   OR email_notifications_enabled IS NULL;
