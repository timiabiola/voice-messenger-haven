-- Fix Security Issues: Function Search Path Mutable

-- Fix get_sender_profile function with explicit search_path
CREATE OR REPLACE FUNCTION public.get_sender_profile(sender_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'id', id,
      'first_name', first_name,
      'last_name', last_name,
      'email', email
    )
    FROM profiles
    WHERE id = sender_id
  );
END;
$$;

-- Fix update_sender_info trigger function with explicit search_path
CREATE OR REPLACE FUNCTION public.update_sender_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.sender = get_sender_profile(NEW.sender_id);
  RETURN NEW;
END;
$$;

-- Fix Materialized View in API issue
-- First, check if the materialized view exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_matviews
    WHERE schemaname = 'public'
    AND matviewname = 'message_delivery_stats'
  ) THEN
    -- Revoke access to materialized view from public roles
    REVOKE ALL ON public.message_delivery_stats FROM anon, authenticated;
    
    -- Grant access only to service role if needed
    GRANT SELECT ON public.message_delivery_stats TO service_role;
  END IF;
END
$$;

-- Create a secure function to access message delivery stats
CREATE OR REPLACE FUNCTION public.get_message_delivery_stats()
RETURNS TABLE (
  message_id uuid,
  sender_id uuid,
  total_recipients bigint,
  delivered_count bigint,
  read_count bigint,
  delivery_rate numeric,
  read_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if materialized view exists
  IF EXISTS (
    SELECT 1
    FROM pg_matviews
    WHERE schemaname = 'public'
    AND matviewname = 'message_delivery_stats'
  ) THEN
    -- Return stats only for messages sent by the current user
    RETURN QUERY
    SELECT
      mds.message_id,
      mds.sender_id,
      mds.total_recipients,
      mds.delivered_count,
      mds.read_count,
      mds.delivery_rate,
      mds.read_rate
    FROM public.message_delivery_stats mds
    WHERE mds.sender_id = auth.uid();
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_message_delivery_stats() TO authenticated;

-- Add comments to document the security fixes
COMMENT ON FUNCTION public.get_sender_profile(uuid) IS 'Securely retrieves sender profile from profiles table with fixed search_path to prevent search path manipulation attacks';
COMMENT ON FUNCTION public.update_sender_info() IS 'Secure trigger function that updates sender info with fixed search_path to prevent search path manipulation attacks';
COMMENT ON FUNCTION public.get_message_delivery_stats() IS 'Secure wrapper function for accessing message_delivery_stats materialized view';

-- Note: To fix "Leaked Password Protection Disabled" issue:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Settings > Security
-- 3. Enable "Leaked password protection"
-- 4. This cannot be done via SQL migration
