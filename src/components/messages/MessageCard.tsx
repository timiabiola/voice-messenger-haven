
import type { MessageCardProps } from './types';
import { MessageHeader } from './MessageHeader';
import { MessageActions } from './MessageActions';
import { PlaybackControls } from './PlaybackControls';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MessageCard = ({ message }: MessageCardProps) => {
  // Add cache buster to audio URL
  const audioUrlWithCache = `${message.audio_url}?t=${Date.now()}`;
  
  const {
    isPlaying,
    isLoading,
    audioRef,
    handlePlayback,
    handleAudioEnded,
    handleAudioError,
    playbackRate,
    currentTime,
    duration,
    handleSpeedChange,
    handleSkipBackward,
    handleSkipForward,
    handleSeek
  } = useAudioPlayback(audioUrlWithCache);

  return (
    <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 rounded-xl border border-zinc-800/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <audio 
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="none"
        playsInline
        webkit-playsinline="true"
        controls={false}
        className="hidden"
      >
        {/* Primary format - MP4 with AAC codec */}
        <source 
          src={audioUrlWithCache} 
          type="audio/mp4;codecs=mp4a.40.2"
        />
        {/* Secondary format - AAC */}
        <source 
          src={audioUrlWithCache} 
          type="audio/aac"
        />
        {/* Fallback format - WebM with Opus codec */}
        <source 
          src={audioUrlWithCache} 
          type="audio/webm;codecs=opus"
        />
        {/* Generic fallback */}
        <source 
          src={audioUrlWithCache} 
          type="audio/*"
        />
      </audio>
      
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header section */}
        <div className="flex items-start justify-between gap-3">
          <MessageHeader message={message} />
          
          {/* Main play button */}
          <button
            onClick={handlePlayback}
            disabled={isLoading}
            className={cn(
              "relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-300 shadow-lg shrink-0",
              isPlaying 
                ? "bg-amber-400 hover:bg-amber-300 scale-105 sm:scale-110" 
                : "bg-zinc-800 hover:bg-zinc-700 group-hover:bg-amber-400 group-hover:text-black",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transform active:scale-95"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-current" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:text-black ml-0.5" />
            )}
          </button>
        </div>

        {/* Playback controls - only show when playing */}
        {isPlaying && (
          <PlaybackControls
            currentTime={currentTime}
            duration={duration}
            playbackRate={playbackRate}
            onSeek={handleSeek}
            onSkipBackward={handleSkipBackward}
            onSkipForward={handleSkipForward}
            onSpeedChange={handleSpeedChange}
            isLoading={isLoading}
          />
        )}

        {/* Action buttons */}
        <MessageActions 
          message={message}
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={handlePlayback}
        />
      </div>
    </div>
  );
};
