
import { useState, useRef, useEffect } from 'react';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
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

      mediaRecorder.ondataavailable = (event) => {
        console.log('Received audio chunk:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      console.log('MediaRecorder started');
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
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
      console.log('Recording stopped, tracks cleaned up');
    }
  };

  const pauseRecording = () => {
    console.log('Pausing recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    console.log('Resuming recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
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
