import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  X, 
  Send, 
  Pause, 
  Play, 
  Trash2, 
  Lock,
  AlertTriangle
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Microphone = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
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

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      audioChunksRef.current = [];
    }
  };

  const handleSendRecording = async () => {
    if (!audioChunksRef.current.length) {
      toast.error('No recording to send');
      return;
    }

    setIsProcessing(true);

    try {
      // Create audio blob and file
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const fileName = `voice_message_${Date.now()}.webm`;
      const file = new File([audioBlob], fileName, { type: 'audio/webm' });

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice_messages')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error('Failed to upload voice message');
      }

      // Get the public URL
      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('voice_messages')
        .getPublicUrl(fileName);

      // Save to database
      const { data: messageData, error: dbError } = await supabase
        .from('voice_messages')
        .insert({
          title: subject || 'Voice Message',
          subject,
          audio_url: audioUrl,
          duration: recordingTime,
          is_urgent: isUrgent,
          is_private: isPrivate
        })
        .select()
        .single();

      if (dbError) {
        throw new Error('Failed to save voice message');
      }

      // Add recipients
      if (recipients.length > 0) {
        const recipientRecords = recipients.map(recipientId => ({
          voice_message_id: messageData.id,
          recipient_id: recipientId
        }));

        const { error: recipientError } = await supabase
          .from('voice_message_recipients')
          .insert(recipientRecords);

        if (recipientError) {
          throw new Error('Failed to add recipients');
        }
      }

      toast.success('Voice message sent successfully');
      navigate('/');
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error('Failed to send voice message');
    } finally {
      setIsProcessing(false);
      handleStopRecording();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="h-16 flex items-center justify-between px-4 bg-white border-b fixed top-0 left-0 right-0 z-10">
        <button 
          className="text-gray-600 hover:text-gray-800"
          onClick={() => navigate(-1)}
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">New Voice Message</h1>
        <button 
          className={`text-blue-600 font-medium ${
            !isRecording || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-700'
          }`}
          disabled={!isRecording || isProcessing}
          onClick={handleSendRecording}
        >
          Send
        </button>
      </header>

      <div className={`flex-1 p-4 space-y-4 mt-16 ${isMobile ? 'mb-20' : 'mb-8'}`}>
        <div className="space-y-2 max-w-2xl mx-auto">
          <label className="text-sm text-gray-600">To:</label>
          <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border focus-within:border-blue-500">
            <input 
              type="text"
              placeholder="Add recipients..."
              className="flex-1 outline-none"
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="space-y-2 max-w-2xl mx-auto">
          <label className="text-sm text-gray-600">Subject:</label>
          <input 
            type="text"
            placeholder="Add a subject..."
            className="w-full p-2 bg-white rounded-lg border focus:border-blue-500 outline-none"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto">
          <button 
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isUrgent ? 'bg-red-100 text-red-600' : 'bg-white text-gray-600'
            }`}
            onClick={() => setIsUrgent(!isUrgent)}
            disabled={isProcessing}
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Urgent</span>
          </button>
          <button 
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isPrivate ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'
            }`}
            onClick={() => setIsPrivate(!isPrivate)}
            disabled={isProcessing}
          >
            <Lock className="w-5 h-5" />
            <span>Private</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8 mt-8">
          <div className={`${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-blue-50 flex items-center justify-center`}>
            <div className={`${isMobile ? 'w-32 h-32' : 'w-44 h-44'} rounded-full bg-blue-100 flex items-center justify-center ${
              isRecording && !isPaused ? 'animate-pulse' : ''
            }`}>
              <Mic className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} ${
                isRecording ? 'text-red-500' : 'text-blue-500'
              }`} />
            </div>
          </div>

          <div className="text-3xl font-medium text-gray-700">
            {formatTime(recordingTime)}
          </div>

          <div className="flex items-center space-x-6">
            {!isRecording ? (
              <button 
                className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors`}
                onClick={handleStartRecording}
                disabled={isProcessing}
              >
                <Mic className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
              </button>
            ) : (
              <>
                <button 
                  className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors`}
                  onClick={handleStopRecording}
                  disabled={isProcessing}
                >
                  <Trash2 className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                </button>
                {isPaused ? (
                  <>
                    <button 
                      className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors`}
                      onClick={handleResumeRecording}
                      disabled={isProcessing}
                    >
                      <Mic className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
                    </button>
                    <button 
                      className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors`}
                      disabled={isProcessing}
                    >
                      <Play className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                    </button>
                  </>
                ) : (
                  <button 
                    className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors`}
                    onClick={handlePauseRecording}
                    disabled={isProcessing}
                  >
                    <Pause className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Microphone;
