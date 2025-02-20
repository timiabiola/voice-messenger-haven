
import type { MessageCardProps } from './types';
import { MessageHeader } from './MessageHeader';
import { MessageActions } from './MessageActions';
import { useAudioPlayback } from './hooks/useAudioPlayback';

export const MessageCard = ({ message }: MessageCardProps) => {
  const {
    isPlaying,
    isLoading,
    audioRef,
    handlePlayback,
    handleAudioEnded,
    handleAudioError
  } = useAudioPlayback(message.audio_url);

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
      />
      
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
