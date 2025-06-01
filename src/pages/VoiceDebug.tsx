import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ensureStorageBucket } from '@/lib/supabase-storage';
import { VoiceRecorder } from '@/components/notes/VoiceRecorder';

export default function VoiceDebug() {
  const [userId, setUserId] = useState<string | null>(null);
  const [bucketStatus, setBucketStatus] = useState<string>('Checking...');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    addLog('Starting setup check...');
    
    // Check user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      addLog(`User authenticated: ${user.id}`);
    } else {
      addLog('No user found!');
    }

    // Check bucket
    const bucketExists = await ensureStorageBucket();
    setBucketStatus(bucketExists ? 'Bucket exists ✓' : 'Bucket missing ✗');
    addLog(`Bucket check: ${bucketExists ? 'exists' : 'missing'}`);
  };

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
    addLog(`Recording complete: ${blob.size} bytes, ${duration} seconds`);
  };

  const testUpload = async () => {
    if (!audioBlob || !userId) {
      addLog('No audio blob or user ID!');
      return;
    }

    try {
      const fileName = `test/${userId}/${Date.now()}.webm`;
      addLog(`Uploading to: ${fileName}`);

      const { data, error } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (error) {
        addLog(`Upload error: ${error.message}`);
        console.error('Upload error:', error);
        return;
      }

      addLog('Upload successful!');
      
      const { data: { publicUrl } } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(fileName);

      setUploadedUrl(publicUrl);
      addLog(`Public URL: ${publicUrl}`);
    } catch (error) {
      addLog(`Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Exception:', error);
    }
  };

  const testPlayback = () => {
    if (!uploadedUrl) {
      addLog('No URL to test!');
      return;
    }

    addLog(`Testing playback of: ${uploadedUrl}`);
    const audio = new Audio(uploadedUrl);
    
    audio.onloadeddata = () => addLog('Audio loaded successfully');
    audio.onerror = (e) => {
      addLog(`Playback error: ${audio.error?.message || 'Unknown'}`);
      console.error('Audio error:', e, audio.error);
    };
    
    audio.play()
      .then(() => addLog('Playback started'))
      .catch(err => addLog(`Play failed: ${err.message}`));
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Voice Debug Page</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>User ID: {userId || 'Not authenticated'}</p>
                <p>Bucket Status: {bucketStatus}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voice Recorder Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                existingAudioUrl={uploadedUrl || undefined}
                existingDuration={audioDuration || undefined}
              />
              
              {audioBlob && (
                <div className="space-y-2">
                  <p>Recording ready: {audioBlob.size} bytes</p>
                  <Button onClick={testUpload}>Test Upload</Button>
                </div>
              )}
              
              {uploadedUrl && (
                <div className="space-y-2">
                  <p className="text-sm break-all">URL: {uploadedUrl}</p>
                  <Button onClick={testPlayback}>Test Playback</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/5 p-4 rounded-lg max-h-96 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="text-sm font-mono">{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 