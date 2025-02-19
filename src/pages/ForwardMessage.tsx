
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
    audioContext.current = new AudioContext();
  }, [location.state, navigate, setSubject]);

  const handleSendRecording = async () => {
    if (!originalMessage) {
      toast.error('No message to forward');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Get the preamble recording as a Blob and decode it
      const preambleChunks = getRecordingData();
      if (preambleChunks.length === 0) {
        toast.error('Please record a preamble message first');
        setIsProcessing(false);
        return;
      }
      const preambleBlob = new Blob(preambleChunks, { type: 'audio/webm;codecs=opus' });
      const preambleArrayBuffer = await preambleBlob.arrayBuffer();
      const preambleAudioBuffer = await audioContext.current!.decodeAudioData(preambleArrayBuffer);

      // 2. Fetch and decode the original message audio
      const originalAudioResponse = await fetch(originalMessage.audio_url);
      if (!originalAudioResponse.ok) {
        throw new Error('Failed to fetch original message audio');
      }
      const originalAudioBlob = await originalAudioResponse.blob();
      const originalArrayBuffer = await originalAudioBlob.arrayBuffer();
      const originalAudioBuffer = await audioContext.current!.decodeAudioData(originalArrayBuffer);

      // 3. Create a new AudioBuffer to combine the two recordings
      const numberOfChannels = Math.max(preambleAudioBuffer.numberOfChannels, originalAudioBuffer.numberOfChannels);
      const sampleRate = audioContext.current!.sampleRate;
      const combinedLength = preambleAudioBuffer.length + originalAudioBuffer.length;
      const combinedBuffer = audioContext.current!.createBuffer(numberOfChannels, combinedLength, sampleRate);

      for (let channel = 0; channel < numberOfChannels; channel++) {
        const combinedData = combinedBuffer.getChannelData(channel);
        // Copy preamble data (if the channel doesn't exist, loop through available channels)
        const preambleData = preambleAudioBuffer.getChannelData(channel % preambleAudioBuffer.numberOfChannels);
        combinedData.set(preambleData, 0);
        // Copy original audio data after the preamble
        const originalData = originalAudioBuffer.getChannelData(channel % originalAudioBuffer.numberOfChannels);
        combinedData.set(originalData, preambleAudioBuffer.length);
      }

      // 4. Render the combined buffer using OfflineAudioContext
      const offlineContext = new OfflineAudioContext(numberOfChannels, combinedBuffer.length, sampleRate);
      const source = offlineContext.createBufferSource();
      source.buffer = combinedBuffer;
      source.connect(offlineContext.destination);
      source.start();
      const renderedBuffer = await offlineContext.startRendering();

      // 5. Record the rendered output using MediaRecorder with improved timing
      const tempContext = new AudioContext();
      await tempContext.resume(); // Ensure the context is active

      const dest = tempContext.createMediaStreamDestination();
      const source2 = tempContext.createBufferSource();
      source2.buffer = renderedBuffer;
      source2.connect(dest);
      source2.connect(tempContext.destination); // Also connect to main output for debugging

      source2.start();

      const recordedChunks: Blob[] = [];
      const options = { mimeType: 'audio/webm;codecs=opus' };
      const mediaRecorder = new MediaRecorder(dest.stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        mediaRecorder.start();

        source2.onended = () => {
          // Add a small delay to ensure all data is captured
          setTimeout(() => {
            mediaRecorder.stop();
          }, 100);
        };
      });

      const finalBlob = new Blob(recordedChunks, { type: 'audio/webm;codecs=opus' });
      console.log('Final combined blob size:', finalBlob.size);

      // 6. Upload the final Blob
      await uploadMessage([finalBlob]);
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
