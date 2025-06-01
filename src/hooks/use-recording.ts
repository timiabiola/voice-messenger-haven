import { useState, useRef, useEffect } from 'react';
import { requestMicrophonePermissions } from '@/utils/microphone-permissions';
import { saveRecordingState } from '@/utils/recording-state';
import type { RecordingState } from '@/types/recording';
import { toast } from 'sonner';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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

  const getSupportedMimeType = () => {
    const types = [
      'audio/mp4;codecs=mp4a.40.2', // AAC in MP4 container
      'audio/mp4',
      'audio/aac',
      'audio/webm;codecs=opus', // Fallback for browsers that don't support MP4
      'audio/webm'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    console.warn('No preferred MIME types supported, falling back to browser default');
    return '';
  };

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await requestMicrophonePermissions();
      
      console.log('Microphone access granted, initializing MediaRecorder...');
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      
      const mediaRecorder = new MediaRecorder(stream, options);
      console.log('MediaRecorder initialized with options:', options);
      
      mediaRecorderRef.current = mediaRecorder;
      
      if (!currentRecordingId) {
        audioChunksRef.current = [];
        setAudioChunks([]);
        setRecordingTime(0);
      }

      mediaRecorder.ondataavailable = async (event) => {
        console.log('ondataavailable fired - event.data:', {
          size: event.data.size,
          type: event.data.type,
          timestamp: new Date().toISOString()
        });
        
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          setAudioChunks([...audioChunksRef.current]);
          console.log('Audio chunks updated. Total chunks:', audioChunksRef.current.length, 'Total size:', audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0), 'bytes');
          
          const newId = await saveRecordingState(
            audioChunksRef.current,
            'in_progress',
            recordingTime,
            currentRecordingId
          );
          if (newId) setCurrentRecordingId(newId);
        } else {
          console.warn('Received empty audio chunk');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };

      mediaRecorder.start(1000);
      console.log('MediaRecorder.start() called with 1000ms timeslice');
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error(error instanceof Error ? error.message : 'Could not access microphone. Please check permissions.');
      throw error;
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      return new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = async () => {
            console.log('MediaRecorder stopped, total chunks:', audioChunksRef.current.length);
            setAudioChunks([...audioChunksRef.current]);
            
            await saveRecordingState(audioChunksRef.current, 'completed', recordingTime, currentRecordingId);
            setCurrentRecordingId(null);
            
            resolve();
          };
          
          mediaRecorderRef.current.stop();
        }
        
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
        setRecordingTime(0);
        console.log('Recording stopped, tracks cleaned up');
      });
    }
  };

  const pauseRecording = async () => {
    console.log('Pausing recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      await saveRecordingState(audioChunksRef.current, 'paused', recordingTime, currentRecordingId);
    }
  };

  const resumeRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      await saveRecordingState(audioChunksRef.current, 'in_progress', recordingTime, currentRecordingId);
    }
  };

  const clearRecording = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
    
    audioChunksRef.current = [];
    setAudioChunks([]);
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setCurrentRecordingId(null);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const getRecordingData = () => {
    return audioChunksRef.current;
  };

  const createAudioFromChunks = () => {
    console.log('=== createAudioFromChunks called ===');
    console.log('audioChunksRef.current.length:', audioChunksRef.current.length);
    
    if (audioChunksRef.current.length === 0) {
      console.error('No audio chunks available for blob creation');
      return null;
    }
    
    audioChunksRef.current.forEach((chunk, index) => {
      console.log(`Chunk ${index}: size=${chunk.size}, type="${chunk.type}"`);
    });
    
    const mimeType = audioChunksRef.current[0].type || getSupportedMimeType();
    console.log('Creating audio blob with MIME type:', mimeType, 'chunks:', audioChunksRef.current.length);
    
    const blob = new Blob(audioChunksRef.current, { type: mimeType });
    console.log('Created blob:', {
      size: blob.size,
      type: blob.type
    });
    
    return blob;
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
    clearRecording,
    getRecordingData: () => audioChunksRef.current,
    createAudioFromChunks,
    audioChunks
  };
}
