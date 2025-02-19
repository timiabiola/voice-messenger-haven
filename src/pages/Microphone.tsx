
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/voice-message/Header';
import { Recipients } from '@/components/voice-message/Recipients';
import { MessageOptions } from '@/components/voice-message/MessageOptions';
import { RecordingControls } from '@/components/voice-message/RecordingControls';
import { useRecording } from '@/hooks/use-recording';
import { useMessageUpload } from '@/hooks/use-message-upload';

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
    getRecordingData
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
    if (selectedProfile) {
      setRecipients([selectedProfile]);
    }
  }, [location.state, setRecipients]);

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
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        isRecording={isRecording}
        isProcessing={isProcessing}
        onSend={handleSendRecording}
      />

      <div className="flex-1 flex flex-col items-center px-4 md:px-6 space-y-4 mt-[72px] mb-[100px] max-w-xl mx-auto w-full">
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
  );
};

export default Microphone;
