-- Secure materialized view to prevent direct API access
-- The message_delivery_stats view should not be accessible via PostgREST API

-- 1. First check if the materialized view exists and has public access
DO $$
BEGIN
  -- Revoke all permissions from the materialized view
  IF EXISTS (
    SELECT 1 
    FROM pg_matviews 
    WHERE schemaname = 'public' 
    AND matviewname = 'message_delivery_stats'
  ) THEN
    -- Revoke all permissions
    EXECUTE 'REVOKE ALL ON public.message_delivery_stats FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON public.message_delivery_stats FROM authenticated';
    EXECUTE 'REVOKE ALL ON public.message_delivery_stats FROM anon';
    
    -- Only grant to service_role for internal use
    EXECUTE 'GRANT SELECT ON public.message_delivery_stats TO service_role';
  END IF;
END $$;

-- 2. Create a secure function to access delivery stats (admin only)
CREATE OR REPLACE FUNCTION get_message_delivery_stats(
  time_range interval DEFAULT '7 days'::interval
)
RETURNS TABLE (
  date date,
  total_messages bigint,
  delivered_messages bigint,
  failed_messages bigint,
  delivery_rate numeric
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow admin users to access delivery stats
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Return aggregated stats from the materialized view
  RETURN QUERY
  SELECT 
    mds.date,
    mds.total_messages,
    mds.delivered_messages,
    mds.failed_messages,
    mds.delivery_rate
  FROM message_delivery_stats mds
  WHERE mds.date >= CURRENT_DATE - time_range
  ORDER BY mds.date DESC;
END;
$$;

-- 3. Create a function for users to see their own message stats
CREATE OR REPLACE FUNCTION get_my_message_stats(
  time_range interval DEFAULT '30 days'::interval
)
RETURNS TABLE (
  sent_messages bigint,
  received_messages bigint,
  total_duration bigint,
  avg_duration numeric
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH sent_stats AS (
    SELECT 
      COUNT(*) as sent_count,
      SUM(duration) as total_duration,
      AVG(duration) as avg_duration
    FROM voice_messages
    WHERE sender_id = auth.uid()
    AND created_at >= CURRENT_DATE - time_range
  ),
  received_stats AS (
    SELECT COUNT(*) as received_count
    FROM voice_message_recipients vmr
    JOIN voice_messages vm ON vm.id = vmr.voice_message_id
    WHERE vmr.recipient_id = auth.uid()
    AND vm.created_at >= CURRENT_DATE - time_range
  )
  SELECT 
    COALESCE(s.sent_count, 0) as sent_messages,
    COALESCE(r.received_count, 0) as received_messages,
    COALESCE(s.total_duration, 0) as total_duration,
    COALESCE(s.avg_duration, 0) as avg_duration
  FROM sent_stats s
  CROSS JOIN received_stats r;
END;
$$;

-- 4. Update the refresh function to include security
CREATE OR REPLACE FUNCTION refresh_message_delivery_stats()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only service role or admin can refresh stats
  IF auth.role() != 'service_role' AND NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied. Service role or admin required.';
  END IF;
  
  REFRESH MATERIALIZED VIEW CONCURRENTLY message_delivery_stats;
END;
$$;

-- 5. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION get_message_delivery_stats(interval) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_message_stats(interval) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_message_delivery_stats() TO service_role;

-- 6. Add comments
COMMENT ON FUNCTION get_message_delivery_stats(interval) IS 'Get message delivery statistics (admin only)';
COMMENT ON FUNCTION get_my_message_stats(interval) IS 'Get personal message statistics for the current user';
COMMENT ON FUNCTION refresh_message_delivery_stats() IS 'Refresh the message delivery stats materialized view';

-- 7. Create a scheduled job to refresh the materialized view (if pg_cron is available)
-- This should be done via Supabase dashboard or CLI as it requires pg_cron extension
-- Example (to be run separately if pg_cron is enabled):
-- SELECT cron.schedule(
--   'refresh-message-stats',
--   '0 2 * * *', -- Daily at 2 AM
--   $$SELECT refresh_message_delivery_stats();$$
-- );