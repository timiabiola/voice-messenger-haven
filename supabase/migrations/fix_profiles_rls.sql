-- First, ensure the profiles table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;

-- Create a simple policy that allows users to do everything with their own profile
CREATE POLICY "Enable all operations for users on their own profile"
ON profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a policy for viewing other profiles (needed for contacts)
CREATE POLICY "Enable read access for all authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Ensure the authenticated role has the necessary permissions
GRANT ALL ON profiles TO authenticated;

-- Create any missing profiles for existing users
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