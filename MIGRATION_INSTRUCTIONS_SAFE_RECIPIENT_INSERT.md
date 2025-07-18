# Safe Recipient Insert Function Migration Instructions

## Overview
This migration fixes the "something went wrong" error when sending voice messages by adding the missing `safe_recipient_insert` RPC function and proper RLS policies.

## Problem
The application was getting a generic error when trying to send messages because:
1. The `safe_recipient_insert` function was missing from the database
2. There were no INSERT policies on the `voice_messages` table
3. Error messages were being sanitized to "Something went wrong" for security reasons
4. **UPDATE**: Parameter name mismatch between JavaScript RPC call and SQL function

## Solution Steps

### 1. Open your Supabase Dashboard
   - Navigate to the SQL Editor

### 2. Run the Migrations in Order
   - First run: `supabase/migrations/20250119_add_safe_recipient_insert_function.sql`
   - Then run: `supabase/migrations/20250119_fix_safe_recipient_insert_parameters.sql`
   - Finally run: `supabase/migrations/20250119_fix_voice_messages_recursion.sql`
   - Execute each SQL query in order

### 3. What These Migrations Do:
   - **First migration creates the `safe_recipient_insert` function**: A secure RPC function that allows message senders to add recipients
   - **Adds INSERT policy**: Allows users to insert their own voice messages
   - **Adds UPDATE policy**: Allows users to update their own voice messages  
   - **Adds DELETE policy**: Allows users to delete their own voice messages
   - **Second migration fixes parameter names**: Updates the function to use parameter names that match the JavaScript RPC call
   - **Third migration fixes infinite recursion**: Drops all existing policies and recreates them without circular references
   - **Ensures RLS is enabled**: Makes sure Row Level Security is active on the voice_messages table

### 4. Verify the Fix
   - Try sending a voice message again
   - Check the browser console for any errors
   - The message should send successfully

## Troubleshooting

If you still see errors after running the migration:

1. **Check the browser console** - In development mode, the actual error will be logged
2. **Verify the migration ran successfully** - Check for any SQL errors when running the migration
3. **Clear your browser cache** - Sometimes old JavaScript can cause issues
4. **Check Supabase logs** - Look for any database errors in the Supabase dashboard

## Technical Details

The `safe_recipient_insert` function:
- Verifies the authenticated user is the message sender
- Checks that the message exists and belongs to the sender
- Prevents duplicate recipients
- Uses SECURITY DEFINER to bypass RLS while maintaining security checks
- Includes proper error handling and logging

## Note on Error Messages

The application uses error sanitization to prevent information disclosure. In production, users see generic messages like "Something went wrong" instead of detailed database errors. This is a security feature, not a bug.

To see detailed errors during development:
1. Check the browser console
2. The logger utility will output the original error when in development mode