
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AudioChunk, RecordingStatus } from '@/types/recording';

export async function saveRecordingState(
  chunks: Blob[],
  status: RecordingStatus,
  recordingTime: number,
  currentRecordingId: string | null
): Promise<string | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('No authenticated session');
    }

    // Convert chunks to base64
    const chunksData = await Promise.all(
      chunks.map(async (chunk) => {
        const buffer = await chunk.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        let binary = '';
        uint8Array.forEach(byte => {
          binary += String.fromCharCode(byte);
        });
        const base64 = btoa(binary);
        
        return {
          data: base64,
          type: chunk.type,
          size: chunk.size
        };
      })
    );

    if (currentRecordingId) {
      const { error } = await supabase
        .from('voice_recordings')
        .update({
          recording_time: recordingTime,
          status,
          audio_chunks: chunksData,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', currentRecordingId);

      if (error) throw error;
      return currentRecordingId;
    } else {
      const { data, error } = await supabase
        .from('voice_recordings')
        .insert({
          recording_time: recordingTime,
          status,
          audio_chunks: chunksData,
          user_id: session.session.user.id
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data?.id || null;
    }
  } catch (error) {
    console.error('Error saving recording state:', error);
    toast.error('Failed to save recording state');
    return null;
  }
}
