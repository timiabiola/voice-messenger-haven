import { Mic, Play, Square } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef, useEffect } from 'react';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  recordingTime: number;
  audioChunks: Blob[];
  createAudioFromChunks: () => Blob | null;
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
  audioChunks,
  createAudioFromChunks,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording
}: RecordingControlsProps) => {
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrl = useRef<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update audio source when recording changes
  useEffect(() => {
    updateAudioSource();
  }, [audioChunks]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (currentAudioUrl.current) {
        URL.revokeObjectURL(currentAudioUrl.current);
      }
    };
  }, []);

  const updateAudioSource = () => {
    if (!audioRef.current) return;
    
    // Clean up previous URL
    if (currentAudioUrl.current) {
      URL.revokeObjectURL(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }
    
    const audioBlob = createAudioFromChunks();
    if (!audioBlob) return;
    
    const url = URL.createObjectURL(audioBlob);
    currentAudioUrl.current = url;
    audioRef.current.src = url;
    
    audioRef.current.onended = () => {
      setIsPlaying(false);
    };
  };

  const handlePlayback = () => {
    if (!audioRef.current || audioChunks.length === 0) return;

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

  const handleMainButtonClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  // Check if we have recorded audio available for playback
  const hasRecordedAudio = audioChunks.length > 0;

  return (
    <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
      <audio ref={audioRef} className="hidden" />
      
      <div className="text-3xl font-medium text-gray-700">
        {formatTime(recordingTime)}
      </div>

      <div className="flex items-center justify-center space-x-6">
        {/* Main recording button - toggles between mic and stop */}
        <button 
          className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          } rounded-full flex items-center justify-center text-white transition-colors ${
            isRecording ? 'animate-pulse' : ''
          }`}
          onClick={handleMainButtonClick}
          disabled={isProcessing || isPlaying}
        >
          {isRecording ? (
            <Square className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
          ) : (
            <Mic className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
          )}
        </button>

        {/* Play button - only show if we have recorded audio */}
        {hasRecordedAudio && (
          <button 
            className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } rounded-full flex items-center justify-center text-white transition-colors`}
            onClick={handlePlayback}
            disabled={isProcessing || isRecording}
          >
            {isPlaying ? (
              <Square className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
            ) : (
              <Play className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
