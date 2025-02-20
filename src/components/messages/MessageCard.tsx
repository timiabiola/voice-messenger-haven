
import type { MessageCardProps } from './types';
import { MessageHeader } from './MessageHeader';
import { MessageActions } from './MessageActions';
import { useAudioPlayback } from './hooks/useAudioPlayback';

export const MessageCard = ({ message }: MessageCardProps) => {
  // Add cache buster to audio URL
  const audioUrlWithCache = `${message.audio_url}?t=${Date.now()}`;
  
  const {
    isPlaying,
    isLoading,
    audioRef,
    handlePlayback,
    handleAudioEnded,
    handleAudioError
  } = useAudioPlayback(audioUrlWithCache);

  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-4">
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
        {/* Primary format - WebM with Opus codec */}
        <source 
          src={audioUrlWithCache} 
          type="audio/webm;codecs=opus"
        />
        {/* Fallback format - MP4 with AAC codec */}
        <source 
          src={audioUrlWithCache.replace('.webm', '.m4a')} 
          type="audio/mp4;codecs=mp4a.40.2"
        />
        {/* Generic fallback */}
        <source 
          src={audioUrlWithCache} 
          type="audio/*"
        />
      </audio>
      
      <MessageHeader message={message} />
      <MessageActions 
        message={message}
        isPlaying={isPlaying}
        isLoading={isLoading}
        onPlayPause={handlePlayback}
      />
    </div>
  );
};
