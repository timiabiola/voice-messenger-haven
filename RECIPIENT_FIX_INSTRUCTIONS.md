# Voice Message Recipient Fix - Instructions

## Problem
Users were able to send messages successfully, but recipients couldn't see them in their inbox due to:
1. Missing `safe_recipient_insert` RPC function
2. Overly restrictive RLS policies that only allowed senders to see messages
3. No real-time updates when new messages arrive

## Solution Applied

### 1. Database Migrations
Two new migrations need to be applied in order:

1. **20250120_create_safe_recipient_insert.sql** - Creates the RPC function for adding recipients
2. **20250119_gradual_restoration.sql** - Adds recipient access without causing recursion

### 2. JavaScript Updates
- Added real-time subscriptions to `useMessages` hook
- Recipients now get live updates when new messages arrive

## Migration Steps

### Step 1: Apply the Migrations

Run these commands in your Supabase SQL editor or via the CLI:

```bash
# If using Supabase CLI:
supabase db push

# Or manually in SQL Editor, run in this order:
# 1. First, run 20250120_create_safe_recipient_insert.sql
# 2. Then, run 20250119_gradual_restoration.sql
```

### Step 2: Verify the Functions

Run this query to verify both functions exist:

```sql
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
WHERE p.proname IN ('safe_recipient_insert', 'is_message_recipient')
ORDER BY p.proname;
```

Expected output:
- `safe_recipient_insert` with arguments `p_message_id uuid, p_recipient_id uuid, p_sender_id uuid`
- `is_message_recipient` with arguments `message_id uuid, user_id uuid`

### Step 3: Test the Complete Flow

1. **Send a Test Message**:
   - Log in as User A
   - Go to `/microphone`
   - Select User B as recipient
   - Record and send a voice message
   - Check browser console for any errors

2. **Verify Recipient Can See Message**:
   - Log in as User B
   - Go to `/inbox`
   - The message from User A should appear
   - Check browser console for "New message received" log

3. **Test Real-time Updates**:
   - Keep User B's inbox open
   - From User A, send another message to User B
   - User B should see the new message appear without refreshing

## Troubleshooting

### If recipients still can't see messages:

1. **Check RLS Policies**:
```sql
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'voice_messages'
ORDER BY policyname;
```

You should see a policy named `select_with_recipient_function` that includes recipient access.

2. **Check if Recipients are Being Added**:
```sql
SELECT 
    vmr.*,
    vm.title,
    sender.email as sender_email,
    recipient.email as recipient_email
FROM voice_message_recipients vmr
JOIN voice_messages vm ON vmr.voice_message_id = vm.id
JOIN profiles sender ON vm.sender_id = sender.id
JOIN profiles recipient ON vmr.recipient_id = recipient.id
ORDER BY vmr.created_at DESC
LIMIT 10;
```

3. **Enable Debug Logging**:
In `src/utils/logger.ts`, temporarily set:
```typescript
const isDevelopment = true;
```

Then check browser console for detailed error messages.

### If you see "infinite recursion" errors:

The gradual restoration migration includes an alternative approach using materialized arrays. Uncomment the section at the bottom of the migration file and run it instead.

## Verification Queries

### Check Recent Messages and Recipients:
```sql
-- See recent messages with recipient count
SELECT 
    vm.id,
    vm.title,
    vm.created_at,
    p.email as sender_email,
    COUNT(vmr.recipient_id) as recipient_count
FROM voice_messages vm
JOIN profiles p ON vm.sender_id = p.id
LEFT JOIN voice_message_recipients vmr ON vm.id = vmr.voice_message_id
GROUP BY vm.id, vm.title, vm.created_at, p.email
ORDER BY vm.created_at DESC
LIMIT 10;
```

### Check What a Specific User Should See:
```sql
-- Replace with actual user ID
SET LOCAL "request.jwt.claims" = '{"sub": "YOUR_USER_ID_HERE"}';

-- This simulates what the user would see
SELECT 
    vm.id,
    vm.title,
    vm.created_at,
    CASE 
        WHEN vm.sender_id = current_setting('request.jwt.claims')::json->>'sub'::uuid 
        THEN 'Sent' 
        ELSE 'Received' 
    END as message_type
FROM voice_messages vm
WHERE 
    vm.sender_id = current_setting('request.jwt.claims')::json->>'sub'::uuid
    OR is_message_recipient(vm.id, current_setting('request.jwt.claims')::json->>'sub'::uuid)
ORDER BY vm.created_at DESC;
```

## Summary

The fix ensures that:
1. Recipients are properly added to the database when messages are sent
2. Recipients can see messages in their inbox through proper RLS policies
3. Real-time updates notify recipients of new messages
4. The implementation avoids infinite recursion issues

After applying these changes, the complete message flow from sending to receiving should work correctly.