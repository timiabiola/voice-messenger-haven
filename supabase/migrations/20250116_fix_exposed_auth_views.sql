-- Fix exposed auth views security issue
-- These views expose auth.users data and must be secured or removed

-- 1. First, revoke all permissions on the exposed views
REVOKE ALL ON public.phone_sync_status FROM PUBLIC;
REVOKE ALL ON public.phone_sync_status FROM authenticated;
REVOKE ALL ON public.phone_sync_status FROM anon;
REVOKE ALL ON public.phone_sync_status FROM service_role;

REVOKE ALL ON public.phone_auth_status FROM PUBLIC;
REVOKE ALL ON public.phone_auth_status FROM authenticated;
REVOKE ALL ON public.phone_auth_status FROM anon;
REVOKE ALL ON public.phone_auth_status FROM service_role;

-- 2. Drop the views as they expose auth.users data
DROP VIEW IF EXISTS public.phone_sync_status CASCADE;
DROP VIEW IF EXISTS public.phone_auth_status CASCADE;

-- 3. Create secure functions to replace the views (only for admin use)
CREATE OR REPLACE FUNCTION get_phone_sync_status()
RETURNS TABLE (
  profile_id uuid,
  profile_phone text,
  profile_phone_verified boolean,
  auth_phone text,
  phones_match boolean,
  needs_sync boolean,
  last_sync_attempt timestamptz,
  sync_error text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.phone as profile_phone,
    p.phone_verified as profile_phone_verified,
    au.phone as auth_phone,
    COALESCE(p.phone = au.phone, false) as phones_match,
    CASE 
      WHEN p.phone IS NOT NULL AND (au.phone IS NULL OR p.phone != au.phone) THEN true
      ELSE false
    END as needs_sync,
    p.last_sync_attempt,
    p.sync_error
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.phone IS NOT NULL
  ORDER BY needs_sync DESC, p.updated_at DESC;
END;
$$;

-- 4. Create function for phone auth status (admin only)
CREATE OR REPLACE FUNCTION get_phone_auth_status()
RETURNS TABLE (
  user_id uuid,
  email text,
  phone text,
  phone_confirmed_at timestamptz,
  created_at timestamptz,
  has_profile boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    au.phone,
    au.phone_confirmed_at,
    au.created_at,
    EXISTS(SELECT 1 FROM profiles p WHERE p.id = au.id) as has_profile
  FROM auth.users au
  WHERE au.phone IS NOT NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- 5. Grant execute permissions only to authenticated users (admin check is in function)
GRANT EXECUTE ON FUNCTION get_phone_sync_status() TO authenticated;
GRANT EXECUTE ON FUNCTION get_phone_auth_status() TO authenticated;

-- 6. Add comments
COMMENT ON FUNCTION get_phone_sync_status() IS 'Secure function to check phone synchronization status (admin only)';
COMMENT ON FUNCTION get_phone_auth_status() IS 'Secure function to check auth phone status (admin only)';

-- 7. Create a non-admin function for users to check their own sync status
CREATE OR REPLACE FUNCTION get_my_phone_sync_status()
RETURNS TABLE (
  profile_phone text,
  profile_phone_verified boolean,
  auth_phone text,
  phones_match boolean,
  needs_sync boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Users can only check their own status
  RETURN QUERY
  SELECT 
    p.phone as profile_phone,
    p.phone_verified as profile_phone_verified,
    au.phone as auth_phone,
    COALESCE(p.phone = au.phone, false) as phones_match,
    CASE 
      WHEN p.phone IS NOT NULL AND (au.phone IS NULL OR p.phone != au.phone) THEN true
      ELSE false
    END as needs_sync
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.id = auth.uid()
  LIMIT 1;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_my_phone_sync_status() TO authenticated;
COMMENT ON FUNCTION get_my_phone_sync_status() IS 'Get phone sync status for the current user only';