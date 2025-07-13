
import { useNavigate } from 'react-router-dom';
import type { Message } from './types';
import { useSaveMessage } from '@/hooks/useSaveMessage';
import { Reply, Forward, Save, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageActionsProps {
  message: Message;
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
}

export const MessageActions = ({ message, isPlaying, isLoading, onPlayPause }: MessageActionsProps) => {
  const navigate = useNavigate();
  const { isSaved, isLoading: isSaveLoading, toggleSave } = useSaveMessage(message.id);

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

  const handleReply = () => {
    navigate('/microphone', {
      state: {
        selectedProfile: message.sender,
        replySubject: `Re: ${message.subject}`
      }
    });
  };

  return (
    <div className="flex items-center gap-2 pt-2 flex-wrap">
      {/* Reply button */}
      <button
        onClick={handleReply}
        className={cn(
          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg",
          "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-amber-400",
          "transition-all duration-200 text-xs sm:text-sm font-medium",
          "hover:shadow-lg active:scale-95"
        )}
      >
        <Reply className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
        <span>Reply</span>
      </button>

      {/* Save button */}
      <button
        onClick={toggleSave}
        disabled={isSaveLoading}
        className={cn(
          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg",
          "transition-all duration-200 text-xs sm:text-sm font-medium",
          "hover:shadow-lg active:scale-95",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isSaved 
            ? "bg-amber-400/20 text-amber-400 hover:bg-amber-400/30" 
            : "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-amber-400"
        )}
        title={isSaved ? 'Unsave message' : 'Save message'}
      >
        <Save className={cn("w-3.5 sm:w-4 h-3.5 sm:h-4", isSaved && "fill-current")} />
        <span>{isSaved ? 'Saved' : 'Save'}</span>
      </button>

      {/* Forward button or Private indicator */}
      {message.is_private ? (
        <div 
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg",
            "bg-zinc-900/50 text-zinc-500 cursor-not-allowed",
            "border border-zinc-800/50",
            "text-xs sm:text-sm"
          )}
          title="This message cannot be forwarded"
        >
          <Lock className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          <span className="font-medium">Private</span>
        </div>
      ) : (
        <button
          onClick={handleForward}
          className={cn(
            "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg",
            "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-amber-400",
            "transition-all duration-200 text-xs sm:text-sm font-medium",
            "hover:shadow-lg active:scale-95"
          )}
        >
          <Forward className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
          <span>Forward</span>
        </button>
      )}
    </div>
  );
};
