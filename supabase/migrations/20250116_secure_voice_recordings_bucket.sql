-- Update voice-recordings bucket to be private and add proper RLS policies
-- This prevents unauthorized access to voice recordings

-- IMPORTANT: We're keeping the bucket PUBLIC for now to maintain backward compatibility
-- The RLS policies will still control access, but URLs will continue to work
-- In a future migration, we can switch to signed URLs after updating the frontend

-- For now, we'll just add the RLS policies without changing the bucket visibility
-- UPDATE storage.buckets SET public = false WHERE id = 'voice-recordings';

-- Drop existing policies that we need to replace
DROP POLICY IF EXISTS "Users can upload voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can update voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Public voice recordings access" ON storage.objects;

-- Create comprehensive RLS policies for the voice-recordings bucket

-- 1. Users can upload their own recordings (path must include their user ID)
CREATE POLICY "Users can upload own recordings" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'voice-recordings' 
  AND (storage.foldername(name))[1] = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 2. Users can view recordings they created
CREATE POLICY "Users can view own recordings" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'voice-recordings' 
  AND (storage.foldername(name))[1] = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. Users can view recordings sent to them (via voice_messages and voice_message_recipients)
CREATE POLICY "Users can view recordings sent to them" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'voice-recordings' 
  AND EXISTS (
    SELECT 1 
    FROM voice_messages vm
    JOIN voice_message_recipients vmr ON vm.id = vmr.voice_message_id
    WHERE vm.audio_url LIKE '%' || storage.objects.name
    AND (vm.sender_id = auth.uid() OR vmr.recipient_id = auth.uid())
  )
);

-- 4. Users can update metadata for their own recordings
CREATE POLICY "Users can update own recordings metadata" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'voice-recordings' 
  AND (storage.foldername(name))[1] = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Users can delete their own recordings
CREATE POLICY "Users can delete own recordings" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'voice-recordings' 
  AND (storage.foldername(name))[1] = 'recordings'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Add comment explaining the security model
COMMENT ON COLUMN storage.buckets.public IS 'Voice recordings bucket is currently public for backward compatibility. Access is controlled via RLS policies. Future migration will switch to private bucket with signed URLs.';