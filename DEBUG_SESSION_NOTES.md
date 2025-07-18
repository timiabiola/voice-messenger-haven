# Debug Session Notes - Message Sending Issue

## Current Status (As of 2025-01-19)

### The Problem
Voice messages fail to send with error: "Something went wrong. Please try again."

### What We've Discovered
1. **Root Error**: "infinite recursion detected in policy for relation 'voice_messages'"
2. **Location**: Error occurs when trying to INSERT into voice_messages table

### What We've Tried
1. ✅ Created `safe_recipient_insert` RPC function
2. ✅ Fixed parameter names to match JavaScript (message_id, recipient_id, sender_id)
3. ✅ Created migration to fix RLS policies and remove recursion
4. ✅ Removed all debug code from production
5. ❌ Issue still persists after all migrations

### Migrations Created (Run in Order)
1. `20250119_add_safe_recipient_insert_function.sql` - Creates initial function
2. `20250119_fix_safe_recipient_insert_parameters.sql` - Fixes parameter names
3. `20250119_fix_voice_messages_recursion.sql` - Fixes RLS policies
4. `20250119_complete_fix_voice_messages.sql` - Complete fix (can run alone)

## Next Steps - Comprehensive Debugging Plan

### Phase 1: Re-Enable Debug Logging
```javascript
// In src/utils/logger.ts
const isDevelopment = true; // Temporarily enable

// In src/utils/error-handler.ts
return {
  message: `DEBUG: ${errorMessage}`, // Show actual error
  ...
}
```

### Phase 2: Create Test Page
Create `src/pages/TestMessageUpload.tsx` to test each operation:

```javascript
// Test 1: Storage Upload
const testStorage = async () => {
  const blob = new Blob(['test'], { type: 'audio/mp4' });
  const result = await supabase.storage
    .from('voice-recordings')
    .upload(`recordings/${userId}/test-${Date.now()}.m4a`, blob);
  console.log('Storage test:', result);
};

// Test 2: Database Insert (without audio_url first)
const testDbInsert = async () => {
  const result = await supabase
    .from('voice_messages')
    .insert({
      title: 'Test Message',
      subject: 'Test',
      sender_id: session.user.id,
      duration: 10,
      is_urgent: false,
      is_private: false
    })
    .select();
  console.log('DB test:', result);
};

// Test 3: RPC Function
const testRPC = async (messageId) => {
  const result = await supabase.rpc('safe_recipient_insert', {
    message_id: messageId,
    recipient_id: 'some-recipient-id',
    sender_id: session.user.id
  });
  console.log('RPC test:', result);
};
```

### Phase 3: Check Supabase Dashboard
1. **SQL Editor**: Run these queries to verify setup
```sql
-- Check if function exists
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'safe_recipient_insert';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'voice_messages';

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'voice_messages';

-- Test insert directly
INSERT INTO voice_messages (
  title, subject, sender_id, duration, is_urgent, is_private
) VALUES (
  'Test', 'Test', auth.uid(), 10, false, false
);
```

2. **Logs**: Check Supabase logs for any errors during message send attempts

### Phase 4: Potential Issues to Check
1. **Missing Columns**: The error might be because `audio_url` column doesn't exist
2. **Storage Bucket**: 'voice-recordings' bucket might not exist or have wrong policies
3. **Authentication**: Session might be expiring or user.id might be null
4. **Trigger Issues**: There might be a database trigger causing recursion

### Phase 5: Quick Fixes to Try
1. **Disable RLS Temporarily** (for testing only):
```sql
ALTER TABLE voice_messages DISABLE ROW LEVEL SECURITY;
-- Test message send
-- Then re-enable:
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
```

2. **Check for Triggers**:
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'voice_messages';
```

## How to Resume Next Session

1. **First**: Check if the issue still exists by trying to send a message
2. **If still broken**: Re-enable debug logging (Phase 1)
3. **Run the test page** to isolate which operation fails
4. **Check Supabase logs** for the time of your test
5. **Apply the fix** based on what you find

## Important Files
- `src/hooks/use-message-upload.ts` - Main upload logic
- `src/pages/Microphone.tsx` - UI for sending messages
- `supabase/migrations/` - All migration files
- `src/utils/error-handler.ts` - Error message handling

## Contact Points
- The error occurs in `use-message-upload.ts` at line ~135 (database insert)
- The actual error is being sanitized, so we need debug logging to see it
- The recursion error suggests an RLS policy issue, but migrations should have fixed it

## Theory
The most likely causes at this point:
1. A trigger on voice_messages table causing recursion
2. Missing `audio_url` column in the table
3. The migrations didn't actually run successfully
4. There's another policy we don't know about

Good luck with your next debugging session!