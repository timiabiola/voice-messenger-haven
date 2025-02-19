
import React from 'react';
import { Header } from '@/components/voice-message/Header';
import { Recipients } from '@/components/voice-message/Recipients';
import { MessageOptions } from '@/components/voice-message/MessageOptions';
import { RecordingControls } from '@/components/voice-message/RecordingControls';
import { useForwardMessage } from '@/hooks/use-forward-message';

const ForwardMessage = () => {
  const {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isUrgent,
    setIsUrgent,
    isPrivate,
    setIsPrivate,
    recipients,
    setRecipients,
    subject,
    setSubject,
    handleSendRecording
  } = useForwardMessage();

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
