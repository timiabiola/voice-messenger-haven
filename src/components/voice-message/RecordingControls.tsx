import { Mic, Play, Square } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef, useEffect } from 'react';
import { PlaybackProgress } from './PlaybackProgress';
import { PlaybackTime } from './PlaybackTime';
import { LoadingSpinner } from './LoadingSpinner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
    console.log('=== updateAudioSource called ===');
    if (!audioRef.current) {
      console.error('No audio element reference');
      return;
    }
    
    console.log('updateAudioSource called, chunks:', audioChunks.length);
    
    // Clean up previous URL
    if (currentAudioUrl.current) {
      console.log('Cleaning up previous audio URL');
      URL.revokeObjectURL(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }
    
    // Reset playback state when audio source changes
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    
    const audioBlob = createAudioFromChunks();
    if (!audioBlob) {
      console.log('No audio blob created');
      return;
    }
    
    console.log('Created audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
    
    const url = URL.createObjectURL(audioBlob);
    currentAudioUrl.current = url;
    audioRef.current.src = url;
    
    console.log('Audio element src set to:', url);
  };

  const handlePlayback = () => {
    console.log('=== handlePlayback called ===');
    
    if (!audioRef.current) {
      console.error('No audio element reference');
      return;
    }
    
    if (audioChunks.length === 0) {
      console.error('No audio chunks available');
      return;
    }

    console.log('Playback clicked, chunks:', audioChunks.length, 'isPlaying:', isPlaying);

    if (isPlaying) {
      console.log('Pausing audio...');
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      console.log('Attempting to play audio...');
      setError(null);
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playback started successfully');
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
              <span className="text-xs text-blue-600 animate-pulse">
                Playing...
              </span>
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
