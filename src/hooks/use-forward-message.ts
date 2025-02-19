
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { combineAudioBuffers, renderAudioBuffer, recordAudioBuffer } from '@/utils/audioProcessing';
import { useRecording } from './use-recording';
import { useMessageUpload } from './use-message-upload';

interface ForwardMessageState {
  originalMessage: {
    id: string;
    audio_url: string;
    subject: string;
  };
}

export const useForwardMessage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [originalMessage, setOriginalMessage] = useState<ForwardMessageState['originalMessage'] | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  
  const recording = useRecording();
  const messageUpload = useMessageUpload();

  useEffect(() => {
    const state = location.state as ForwardMessageState;
    if (!state?.originalMessage) {
      toast.error('No message to forward');
      navigate('/');
      return;
    }
    
    setOriginalMessage(state.originalMessage);
    messageUpload.setSubject(`Fwd: ${state.originalMessage.subject}`);
    audioContext.current = new AudioContext();
  }, [location.state, navigate, messageUpload.setSubject]);

  const handleSendRecording = async () => {
    if (!originalMessage) {
      toast.error('No message to forward');
      return;
    }

    recording.setIsProcessing(true);
    try {
      const preambleChunks = recording.getRecordingData();
      if (preambleChunks.length === 0) {
        toast.error('Please record a preamble message first');
        recording.setIsProcessing(false);
        return;
      }

      // Decode preamble
      const preambleBlob = new Blob(preambleChunks, { type: 'audio/webm;codecs=opus' });
      const preambleArrayBuffer = await preambleBlob.arrayBuffer();
      const preambleAudioBuffer = await audioContext.current!.decodeAudioData(preambleArrayBuffer);

      // Fetch and decode original message
      const originalAudioResponse = await fetch(originalMessage.audio_url);
      if (!originalAudioResponse.ok) {
        throw new Error('Failed to fetch original message audio');
      }
      const originalAudioBlob = await originalAudioResponse.blob();
      const originalArrayBuffer = await originalAudioBlob.arrayBuffer();
      const originalAudioBuffer = await audioContext.current!.decodeAudioData(originalArrayBuffer);

      // Combine audio buffers
      const combinedBuffer = await combineAudioBuffers(
        audioContext.current!,
        preambleAudioBuffer,
        originalAudioBuffer
      );

      // Render combined buffer
      const renderedBuffer = await renderAudioBuffer(
        combinedBuffer,
        combinedBuffer.numberOfChannels,
        audioContext.current!.sampleRate
      );

      // Record final audio
      const finalBlob = await recordAudioBuffer(renderedBuffer);
      console.log('Final combined blob size:', finalBlob.size);

      // Upload the final recording
      await messageUpload.uploadMessage([finalBlob]);
      toast.success('Message forwarded successfully');
      navigate('/inbox');
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to forward message. Please try again.');
    } finally {
      recording.setIsProcessing(false);
      recording.stopRecording();
    }
  };

  return {
    ...recording,
    ...messageUpload,
    handleSendRecording,
  };
};
