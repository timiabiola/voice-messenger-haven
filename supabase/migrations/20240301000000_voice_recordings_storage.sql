-- Create voice-recordings storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-recordings',
  'voice-recordings',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own voice recordings
CREATE POLICY "Users can upload voice recordings" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'voice-recordings' AND
  auth.uid()::text = (string_to_array(name, '/'))[2]
);

-- Policy: Users can update their own voice recordings
CREATE POLICY "Users can update voice recordings" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'voice-recordings' AND
  auth.uid()::text = (string_to_array(name, '/'))[2]
);

-- Policy: Users can delete their own voice recordings
CREATE POLICY "Users can delete voice recordings" ON storage.objects
FOR DELETE USING (
  bucket_id = 'voice-recordings' AND
  auth.uid()::text = (string_to_array(name, '/'))[2]
);

-- Policy: Anyone can view voice recordings (public bucket)
CREATE POLICY "Public voice recordings access" ON storage.objects
FOR SELECT USING (bucket_id = 'voice-recordings'); 