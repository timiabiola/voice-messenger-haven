-- Create a function to check if a user has a specific role
-- This is critical for admin authentication and authorization

-- First, ensure we have a roles table structure
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
-- Only authenticated users can see their own roles
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update/delete roles (admin management)
CREATE POLICY "Service role can manage all roles" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- Create the has_role function
CREATE OR REPLACE FUNCTION has_role(role_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Return true if the current user has the specified role
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = role_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION has_role(TEXT) TO authenticated;

-- Create an index for performance
CREATE INDEX idx_user_roles_user_id_role ON user_roles(user_id, role);

-- Add comment
COMMENT ON FUNCTION has_role(TEXT) IS 'Check if the current authenticated user has a specific role';

-- Insert initial admin role for testing (replace with actual admin user ID)
-- This should be done manually after deployment for security
-- Example: INSERT INTO user_roles (user_id, role) VALUES ('your-admin-user-id', 'admin');