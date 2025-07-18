# Message Threading Migration Instructions

## Overview
This migration adds threading support to voice messages, allowing users to reply to messages and view conversations in a threaded format.

## Database Migration Steps

1. **Open your Supabase Dashboard**
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy and paste the contents of `supabase/migrations/20250118_add_message_threading.sql`
   - Execute the SQL query

3. **What This Migration Does:**
   - Adds `parent_message_id` column to track message replies
   - Adds `thread_id` column to group messages in conversations
   - Creates indexes for faster thread queries
   - Adds a trigger to automatically set `thread_id` when messages are created
   - Creates a function `get_thread_messages` to retrieve threaded conversations
   - Updates RLS policies to allow users to view entire threads they have access to

## Frontend Changes

### New Features:
1. **Thread View**: Click the "X Replies" button on a message to view the entire conversation thread
2. **Reply to Messages**: Click "Reply" to respond to a specific message in a thread
3. **Thread Navigation**: New route `/thread/:threadId` displays threaded conversations

### Updated Components:
- `MessageCard` - Now shows reply count and thread navigation
- `MessageActions` - Added "View Thread" button for messages with replies
- `ThreadedMessageView` - New component for displaying nested message threads
- `MessageReplyModal` - New modal for replying to messages with voice recordings

### New Hooks:
- `useThreadedMessages` - Fetches and manages threaded message data
- `useMessageReplyCounts` - Gets reply counts for messages

## Testing the Feature

1. Send a new voice message
2. View it in your inbox
3. Click "Reply" to create a threaded conversation
4. Click "X Replies" to view the full thread
5. Continue replying to create nested conversations

## Notes
- Existing messages will be treated as root messages (no parent)
- The threading depth is limited to 5 levels by default (configurable)
- Real-time updates work within threads - new replies appear automatically