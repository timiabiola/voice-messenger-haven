-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;

-- Create SELECT policy - users can view all profiles (needed for contacts)
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Create UPDATE policy - users can only update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- Add comment to document the policies
COMMENT ON POLICY "Profiles are viewable by authenticated users" ON profiles IS 'Allow authenticated users to view all profiles for contacts functionality';
COMMENT ON POLICY "Users can update their own profile" ON profiles IS 'Allow users to update only their own profile information'; 