
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

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      const stream = await requestMicrophonePermissions();
      
      console.log('Microphone access granted, initializing MediaRecorder...');
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Only reset chunks if we're starting a new recording
      if (!currentRecordingId) {
        audioChunksRef.current = [];
        setRecordingTime(0);
      }

      mediaRecorder.ondataavailable = async (event) => {
        console.log('Received audio chunk:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          const newId = await saveRecordingState(
            audioChunksRef.current,
            'in_progress',
            recordingTime,
            currentRecordingId
          );
          if (newId) setCurrentRecordingId(newId);
        }
      };

      mediaRecorder.start(100);
      console.log('MediaRecorder started');
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
      await saveRecordingState(audioChunksRef.current, 'completed', recordingTime, currentRecordingId);
      setCurrentRecordingId(null);
      // Reset recording time when stopping
      setRecordingTime(0);
      console.log('Recording stopped, tracks cleaned up');
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
    console.log('Resuming recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      await saveRecordingState(audioChunksRef.current, 'in_progress', recordingTime, currentRecordingId);
    }
  };

  const getRecordingData = () => {
    console.log('Getting recording data, chunks:', audioChunksRef.current.length);
    return audioChunksRef.current;
  };

  const createAudioFromChunks = () => {
    return new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
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
    getRecordingData,
    createAudioFromChunks,
    audioChunks: audioChunksRef.current
  };
}
