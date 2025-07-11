import { Mic, Play, Square, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef, useEffect } from 'react';
import { PlaybackProgress } from './PlaybackProgress';
import { PlaybackTime } from './PlaybackTime';
import { LoadingSpinner } from './LoadingSpinner';
import { AudioWaveform } from './AudioWaveform';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { toast } from 'sonner';

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
  clearRecording: () => void;
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
  onResumeRecording,
  clearRecording
}: RecordingControlsProps) => {
  const isMobile = useIsMobile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrl = useRef<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update audio source when recording changes or chunks update
  useEffect(() => {
    updateAudioSource();
  }, [audioChunks, isRecording]);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (currentAudioUrl.current) {
        URL.revokeObjectURL(currentAudioUrl.current);
      }
    };
  }, []);

  // Add audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const updateAudioSource = () => {
    if (!audioRef.current) {
      console.error('No audio element reference');
      return;
    }
    
    if (currentAudioUrl.current) {
      URL.revokeObjectURL(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }
    
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    
    const audioBlob = createAudioFromChunks();
    if (!audioBlob) {
      return;
    }
    
    const url = URL.createObjectURL(audioBlob);
    currentAudioUrl.current = url;
    audioRef.current.src = url;
  };

  const handlePlayback = () => {
    if (!audioRef.current) {
      console.error('No audio element reference');
      return;
    }
    
    if (audioChunks.length === 0) {
      console.error('No audio chunks available');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setError(null);
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error('Playback error:', error);
            setError('Playback failed');
            setIsPlaying(false);
          });
      }
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleMainButtonClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    // Stop playback if playing
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Clear the recording
    clearRecording();
    
    // Reset all playback states
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    
    // Clean up audio URL
    if (currentAudioUrl.current) {
      URL.revokeObjectURL(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }
    
    // Clear audio element source
    if (audioRef.current) {
      audioRef.current.src = '';
    }
    
    // Show success toast
    toast.success('Recording deleted');
  };

  // Check if we have recorded audio available for playback
  const hasRecordedAudio = audioChunks.length > 0;

  return (
    <div className="w-full flex flex-col items-center justify-center text-center space-y-6 relative">
      <audio ref={audioRef} className="hidden" />
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
      
      {/* Delete button - positioned absolutely in top-right */}
      {hasRecordedAudio && !isRecording && (
        <button
          onClick={handleDelete}
          className={`
            absolute ${isMobile ? 'top-0 right-0' : '-top-2 -right-2'}
            ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
            flex items-center justify-center
            bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20
            text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500
            rounded-full transition-all duration-200
            hover:scale-105 active:scale-95
            animate-in fade-in duration-300
            shadow-sm hover:shadow-md
            group
          `}
          title="Delete recording"
          disabled={isProcessing || isLoading}
        >
          <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} transition-transform group-hover:rotate-6`} />
        </button>
      )}
      
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

        {/* Play button - only show if we have recorded audio and not currently recording */}
        {hasRecordedAudio && !isRecording && (
          <button 
            className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} ${
              error 
                ? 'bg-red-600 hover:bg-red-700' 
                : isPlaying 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
            } rounded-full flex items-center justify-center text-white transition-all ${
              isLoading ? 'opacity-75' : ''
            } ${isPlaying && !isLoading ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}`}
            onClick={handlePlayback}
            disabled={isProcessing || isLoading || !!error}
            title={error || (isPlaying ? 'Stop' : 'Play')}
          >
            {isLoading ? (
              <LoadingSpinner size={isMobile ? 'md' : 'lg'} />
            ) : error ? (
              <span className="text-sm">!</span>
            ) : isPlaying ? (
              <Square className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
            ) : (
              <Play className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
            )}
          </button>
        )}
      </div>

      {/* Playback progress and time - only show when audio is available */}
      {hasRecordedAudio && !isRecording && (
        <div className="w-full max-w-xs space-y-2 animate-in fade-in duration-300">
          <PlaybackProgress 
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            isLoading={isLoading}
            isPlaying={isPlaying}
          />
          <div className="flex items-center justify-between">
            <PlaybackTime 
              currentTime={currentTime}
              duration={duration}
              isLoading={isLoading}
            />
            {isPlaying && !isLoading && (
              <AudioWaveform isPlaying={isPlaying} className="text-blue-600" />
            )}
          </div>
          {error && (
            <div className="text-sm text-red-500 text-center animate-in fade-in">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
