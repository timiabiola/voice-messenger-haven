
import { Play, Square, Forward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Message } from './types';

interface MessageActionsProps {
  message: Message;
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
}

export const MessageActions = ({ message, isPlaying, isLoading, onPlayPause }: MessageActionsProps) => {
  const navigate = useNavigate();

  const handleForward = () => {
    navigate('/forward', {
      state: {
        originalMessage: {
          id: message.id,
          audio_url: message.audio_url,
          subject: message.subject
        }
      }
    });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={onPlayPause}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-black rounded-full text-sm font-medium hover:bg-amber-300 transition-colors touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        <span>{isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}</span>
      </button>

      <button
        onClick={handleForward}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-amber-400 rounded-full text-sm font-medium hover:bg-zinc-700 transition-colors touch-manipulation active:scale-95"
      >
        <Forward className="w-4 h-4" />
        <span>Forward</span>
      </button>
    </div>
  );
};
