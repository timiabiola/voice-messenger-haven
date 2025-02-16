
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Header } from '@/components/voice-message/Header';
import { Recipients, type Profile } from '@/components/voice-message/Recipients';
import { MessageOptions } from '@/components/voice-message/MessageOptions';
import { RecordingControls } from '@/components/voice-message/RecordingControls';

const Microphone = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [recipients, setRecipients] = useState<Profile[]>([]);
  const [subject, setSubject] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const selectedProfile = location.state?.selectedProfile;
    if (selectedProfile) {
      setRecipients([selectedProfile]);
    }
  }, [location.state]);

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

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const handleSendRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error('No recording to send');
      return;
    }

    if (recipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to send messages');
        return;
      }

      console.log('Starting voice message upload process...');

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const fileName = `voice_message_${Date.now()}.webm`;
      const file = new File([audioBlob], fileName, { type: 'audio/webm' });

      console.log('Uploading file:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice_messages')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload voice message');
      }

      console.log('File uploaded successfully:', uploadData);

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('voice_messages')
        .getPublicUrl(fileName);

      console.log('Got public URL:', audioUrl);

      const { data: messageData, error: dbError } = await supabase
        .from('voice_messages')
        .insert({
          title: subject || 'Voice Message',
          subject,
          audio_url: audioUrl,
          duration: recordingTime,
          is_urgent: isUrgent,
          is_private: isPrivate,
          sender_id: session.user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('Voice message creation error:', dbError);
        throw new Error('Failed to save voice message');
      }

      console.log('Voice message created:', messageData);

      for (const recipient of recipients) {
        console.log('Adding recipient:', recipient.id);
        const { error: recipientError } = await supabase.rpc('safe_recipient_insert', {
          message_id: messageData.id,
          recipient_id: recipient.id,
          sender_id: session.user.id
        });

        if (recipientError) {
          console.error('Failed to add recipient:', recipient.id, recipientError);
          throw new Error(`Failed to add recipient: ${recipient.email}`);
        }
      }

      console.log('All recipients added successfully');
      toast.success('Voice message sent successfully');
      navigate('/');
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message. Please try again.');
    } finally {
      setIsProcessing(false);
      handleStopRecording();
      audioChunksRef.current = [];
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        isRecording={isRecording}
        isProcessing={isProcessing}
        onSend={handleSendRecording}
      />

      <div className="flex-1 px-3 space-y-4 mt-[72px] mb-[100px] max-w-2xl mx-auto w-full">
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
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onPauseRecording={handlePauseRecording}
          onResumeRecording={handleResumeRecording}
        />
      </div>
    </div>
  );
};

export default Microphone;
