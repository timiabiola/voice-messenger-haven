
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/voice-message/Header';
import { Recipients } from '@/components/voice-message/Recipients';
import { MessageOptions } from '@/components/voice-message/MessageOptions';
import { RecordingControls } from '@/components/voice-message/RecordingControls';
import { useRecording } from '@/hooks/use-recording';
import { useMessageUpload } from '@/hooks/use-message-upload';

interface ForwardMessageState {
  originalMessage: {
    id: string;
    audio_url: string;
    subject: string;
  };
}

const ForwardMessage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [originalMessage, setOriginalMessage] = useState<ForwardMessageState['originalMessage'] | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  
  const {
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
    createAudioFromChunks
  } = useRecording();

  const {
    isUrgent,
    setIsUrgent,
    isPrivate,
    setIsPrivate,
    recipients,
    setRecipients,
    subject,
    setSubject,
    uploadMessage
  } = useMessageUpload();

  useEffect(() => {
    const state = location.state as ForwardMessageState;
    if (!state?.originalMessage) {
      toast.error('No message to forward');
      navigate('/');
      return;
    }
    
    setOriginalMessage(state.originalMessage);
    setSubject(`Fwd: ${state.originalMessage.subject}`);

    // Initialize AudioContext - removed webkitAudioContext since it's not needed in modern browsers
    audioContext.current = new AudioContext();
  }, [location.state, navigate, setSubject]);

  const handleSendRecording = async () => {
    if (!originalMessage) {
      toast.error('No message to forward');
      return;
    }

    setIsProcessing(true);
    try {
      // Get the preamble recording as a Blob
      const preambleChunks = getRecordingData();
      if (preambleChunks.length === 0) {
        toast.error('Please record a preamble message first');
        setIsProcessing(false);
        return;
      }

      console.log('Preamble chunks:', preambleChunks.length);
      
      // Download the original message audio
      const originalAudioResponse = await fetch(originalMessage.audio_url);
      if (!originalAudioResponse.ok) {
        throw new Error('Failed to fetch original message audio');
      }
      const originalAudioBlob = await originalAudioResponse.blob();
      console.log('Original audio blob size:', originalAudioBlob.size);
      
      // Create a combined blob
      const combinedBlob = new Blob([...preambleChunks, originalAudioBlob], {
        type: 'audio/webm;codecs=opus'
      });
      console.log('Combined blob size:', combinedBlob.size);
      
      // Convert Blob to array buffer for proper audio handling
      const arrayBuffer = await combinedBlob.arrayBuffer();
      const audioBuffer = await audioContext.current!.decodeAudioData(arrayBuffer);
      
      // Create a new blob from the processed audio using AudioContext
      const processedBlob = await new Promise<Blob>((resolve) => {
        const destination = audioContext.current!.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm;codecs=opus' }));
        
        const source = audioContext.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(destination);
        
        mediaRecorder.start();
        source.start(0);
        source.onended = () => mediaRecorder.stop();
      });
      
      await uploadMessage([processedBlob]);
      toast.success('Message forwarded successfully');
      navigate('/inbox');
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to forward message. Please try again.');
    } finally {
      setIsProcessing(false);
      stopRecording();
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-black">
      <div className="h-[64px] w-full">
        <Header 
          isRecording={isRecording}
          isProcessing={isProcessing}
          onSend={handleSendRecording}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 pb-24 sm:pb-4">
        <div className="w-full max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-medium text-amber-400">Forward Message</h2>
            <p className="text-sm text-amber-400/60">
              Record a preamble message that will play before the forwarded message
            </p>
          </div>

          <Recipients 
            recipients={recipients}
            onAddRecipient={(profile) => setRecipients([...recipients, profile])}
            onRemoveRecipient={(profileId) => setRecipients(recipients.filter(r => r.id !== profileId))}
            isProcessing={isProcessing}
          />

          <MessageOptions 
            subject={subject}
            onSubjectChange={setSubject}
            isUrgent={isUrgent}
            onUrgentChange={setIsUrgent}
            isPrivate={isPrivate}
            onPrivateChange={setIsPrivate}
            isProcessing={isProcessing}
          />

          <RecordingControls 
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessing={isProcessing}
            recordingTime={recordingTime}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onPauseRecording={pauseRecording}
            onResumeRecording={resumeRecording}
          />
        </div>
      </div>
    </div>
  );
};

export default ForwardMessage;
