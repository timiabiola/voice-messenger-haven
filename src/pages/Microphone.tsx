
import React, { useState, useEffect } from 'react';
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

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    setIsPaused(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 bg-white border-b fixed top-0 left-0 right-0 z-10">
        <button 
          className="text-gray-600 hover:text-gray-800"
          onClick={() => navigate(-1)}
        >
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">New Voice Message</h1>
        <button 
          className={`text-blue-600 font-medium ${!isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-700'}`}
          disabled={!isRecording}
        >
          Send
        </button>
      </header>

      {/* Main Content */}
      <div className={`flex-1 p-4 space-y-4 mt-16 ${isMobile ? 'mb-20' : 'mb-8'}`}>
        {/* Recipients */}
        <div className="space-y-2 max-w-2xl mx-auto">
          <label className="text-sm text-gray-600">To:</label>
          <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border focus-within:border-blue-500">
            <input 
              type="text"
              placeholder="Add recipients..."
              className="flex-1 outline-none"
            />
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-2 max-w-2xl mx-auto">
          <label className="text-sm text-gray-600">Subject:</label>
          <input 
            type="text"
            placeholder="Add a subject..."
            className="w-full p-2 bg-white rounded-lg border focus:border-blue-500 outline-none"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* Message Options */}
        <div className="flex flex-wrap gap-4 justify-center max-w-2xl mx-auto">
          <button 
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isUrgent ? 'bg-red-100 text-red-600' : 'bg-white text-gray-600'
            }`}
            onClick={() => setIsUrgent(!isUrgent)}
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Urgent</span>
          </button>
          <button 
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              isPrivate ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'
            }`}
            onClick={() => setIsPrivate(!isPrivate)}
          >
            <Lock className="w-5 h-5" />
            <span>Private</span>
          </button>
        </div>

        {/* Recording Interface */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 mt-8">
          {/* Recording Visualization */}
          <div className={`${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-blue-50 flex items-center justify-center`}>
            <div className={`${isMobile ? 'w-32 h-32' : 'w-44 h-44'} rounded-full bg-blue-100 flex items-center justify-center ${
              isRecording && !isPaused ? 'animate-pulse' : ''
            }`}>
              <Mic className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} ${
                isRecording ? 'text-red-500' : 'text-blue-500'
              }`} />
            </div>
          </div>

          {/* Recording Time */}
          <div className="text-3xl font-medium text-gray-700">
            {formatTime(recordingTime)}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center space-x-6">
            {!isRecording ? (
              <button 
                className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors`}
                onClick={handleStartRecording}
              >
                <Mic className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
              </button>
            ) : (
              <>
                <button 
                  className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors`}
                  onClick={handleStopRecording}
                >
                  <Trash2 className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                </button>
                <button 
                  className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors`}
                  onClick={isPaused ? handleResumeRecording : handlePauseRecording}
                >
                  {isPaused ? 
                    <Play className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} /> : 
                    <Pause className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
                  }
                </button>
                <button 
                  className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors`}
                >
                  <Send className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Microphone;
