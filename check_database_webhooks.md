# Check for Database Webhooks

Database webhooks in Supabase can also trigger on table events and might be causing the net.http_post error.

## How to Check for Database Webhooks

### Via Supabase Dashboard:

1. **Go to your Supabase Dashboard**: https://app.supabase.com/project/qzkzwtmzqysvhdsbrfzo
2. **Navigate to Database → Webhooks** (or Database → Triggers)
3. **Look for any webhooks on the `voice_messages` table**
4. **Check if any webhooks are configured to run on INSERT events**

### Via SQL Query:

Run this query to check for webhook-related triggers:

```sql
-- Check for all triggers created by supabase_functions.http_request
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE pg_get_triggerdef(oid) LIKE '%supabase_functions.http_request%'
ORDER BY table_name, trigger_name;

-- Also check the net schema for webhook history
SELECT 
    COUNT(*) as total_webhook_calls,
    MAX(created) as last_webhook_call
FROM net._http_response;
```

## If You Find Webhooks:

If there are webhooks configured on the `voice_messages` table:
1. **Disable or delete them** in the Dashboard
2. Or **update them** to use the edge function instead of pg_net

The key is to remove any database-level attempts to call external URLs using pg_net. 