
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  const saveRecordingState = async (chunks: Blob[], status: 'in_progress' | 'paused' | 'completed') => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('No authenticated session');
      }

      // Convert chunks to base64
      const chunksData = await Promise.all(
        chunks.map(async (chunk) => {
          const buffer = await chunk.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
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
          })
          .eq('id', currentRecordingId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('voice_recordings')
          .insert({
            recording_time: recordingTime,
            status,
            audio_chunks: chunksData,
            user_id: session.session.user.id
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentRecordingId(data.id);
      }
    } catch (error) {
      console.error('Error saving recording state:', error);
      toast.error('Failed to save recording state');
    }
  };

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        } 
      });
      
      console.log('Microphone access granted, initializing MediaRecorder...');
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = async (event) => {
        console.log('Received audio chunk:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          await saveRecordingState(audioChunksRef.current, 'in_progress');
        }
      };

      mediaRecorder.start(100);
      console.log('MediaRecorder started');
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
        streamRef.current = null;
      }
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
      
      // Save final state
      await saveRecordingState(audioChunksRef.current, 'completed');
      setCurrentRecordingId(null);
      console.log('Recording stopped, tracks cleaned up');
    }
  };

  const pauseRecording = async () => {
    console.log('Pausing recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      await saveRecordingState(audioChunksRef.current, 'paused');
    }
  };

  const resumeRecording = async () => {
    console.log('Resuming recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      await saveRecordingState(audioChunksRef.current, 'in_progress');
    }
  };

  const getRecordingData = () => {
    console.log('Getting recording data, chunks:', audioChunksRef.current.length);
    return audioChunksRef.current;
  };

  return {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    setIsProcessing,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getRecordingData
  };
}
