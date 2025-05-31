import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/voice-message/Header';
import { Recipients } from '@/components/voice-message/Recipients';
import { MessageOptions } from '@/components/voice-message/MessageOptions';
import { RecordingControls } from '@/components/voice-message/RecordingControls';
import { useRecording } from '@/hooks/use-recording';
import { useMessageUpload } from '@/hooks/use-message-upload';

const HEADER_HEIGHT = 64;

const Microphone = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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
    audioChunks,
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
    const selectedProfile = location.state?.selectedProfile;
    const replySubject = location.state?.replySubject;
    
    if (selectedProfile) {
      setRecipients([selectedProfile]);
    }
    
    if (replySubject) {
      setSubject(replySubject);
    }
  }, [location.state, setRecipients, setSubject]);

  const handleSendRecording = async () => {
    setIsProcessing(true);
    try {
      await uploadMessage(getRecordingData());
      toast.success('Voice message sent successfully');
      navigate('/');
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send voice message. Please try again.');
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
            audioChunks={audioChunks}
            createAudioFromChunks={createAudioFromChunks}
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

export default Microphone;
