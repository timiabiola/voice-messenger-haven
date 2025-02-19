
import { Mic, Trash2, Play, Pause, Square } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef } from 'react';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
}

export const RecordingControls = ({
  isRecording,
  isPaused,
  isProcessing,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording
}: RecordingControlsProps) => {
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(error => {
        console.error('Playback error:', error);
      });
      setIsPlaying(true);
    }
  };

  const updateAudioSource = (chunks: Blob[]) => {
    if (!audioRef.current || chunks.length === 0) return;
    
    const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
    const url = URL.createObjectURL(blob);
    
    audioRef.current.src = url;
    audioRef.current.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
    };
  };

  return (
    <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
      <audio ref={audioRef} className="hidden" />
      
      <div className="text-3xl font-medium text-gray-700">
        {formatTime(recordingTime)}
      </div>

      <div className="flex items-center justify-center space-x-6">
        {!isRecording ? (
          <button 
            className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors`}
            onClick={onStartRecording}
            disabled={isProcessing || isPlaying}
          >
            <Mic className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
          </button>
        ) : (
          <>
            <button 
              className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors`}
              onClick={onStopRecording}
              disabled={isProcessing || isPlaying}
            >
              <Trash2 className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
            </button>
            <button 
              className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors ${
                isRecording && !isPaused ? 'animate-pulse' : ''
              }`}
              onClick={isPaused ? onResumeRecording : onPauseRecording}
              disabled={isProcessing || isPlaying}
            >
              <Mic className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
            </button>
            <button 
              className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} ${isPlaying ? 'bg-red-600' : 'bg-blue-600'} rounded-full flex items-center justify-center text-white hover:${isPlaying ? 'bg-red-700' : 'bg-blue-700'} transition-colors`}
              onClick={handlePlayback}
              disabled={isProcessing || (!isPaused && isRecording)}
            >
              {isPlaying ? (
                <Square className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
              ) : (
                <Play className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
