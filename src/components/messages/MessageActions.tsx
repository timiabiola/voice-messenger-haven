
import { useNavigate } from 'react-router-dom';
import type { Message } from './types';
import { useSaveMessage } from '@/hooks/useSaveMessage';

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
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Primary actions row - Play and Reply */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPlayPause}
          disabled={isLoading}
          className="flex items-center justify-center px-3 py-2 sm:px-4 bg-amber-400 text-black rounded-full text-xs sm:text-sm font-medium hover:bg-amber-300 transition-colors touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none min-w-0"
        >
          <span className="text-xs sm:text-sm font-semibold">
            {isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}
          </span>
        </button>

        <button
          onClick={handleReply}
          className="flex items-center justify-center px-3 py-2 sm:px-4 bg-zinc-800 text-amber-400 rounded-full text-xs sm:text-sm font-medium hover:bg-zinc-700 transition-colors touch-manipulation active:scale-95 flex-1 sm:flex-none min-w-0"
        >
          <span className="text-xs sm:text-sm font-semibold">Reply</span>
        </button>
      </div>

      {/* Secondary actions row - Save and Forward/Private */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSave}
          disabled={isSaveLoading}
          className={`flex items-center justify-center px-3 py-2 sm:px-4 rounded-full text-xs sm:text-sm font-medium transition-colors touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none min-w-0 ${
            isSaved 
              ? 'bg-amber-400 text-black hover:bg-amber-300' 
              : 'bg-zinc-800 text-amber-400 hover:bg-zinc-700'
          }`}
          title={isSaved ? 'Unsave message' : 'Save message'}
        >
          <span className="text-xs sm:text-sm font-semibold">
            {isSaved ? 'Saved' : 'Save'}
          </span>
        </button>

        {message.is_private ? (
          <div 
            className="flex items-center justify-center px-3 py-2 sm:px-4 bg-zinc-900/50 text-zinc-400 rounded-full text-xs sm:text-sm font-medium cursor-not-allowed border border-zinc-800 relative group flex-1 sm:flex-none min-w-0"
            title="This message cannot be forwarded"
          >
            <span className="text-xs sm:text-sm font-semibold text-zinc-500">Private</span>
            
            {/* Tooltip on hover - only show on desktop */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
              <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded whitespace-nowrap">
                Cannot be forwarded
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleForward}
            className="flex items-center justify-center px-3 py-2 sm:px-4 bg-zinc-800 text-amber-400 rounded-full text-xs sm:text-sm font-medium hover:bg-zinc-700 transition-colors touch-manipulation active:scale-95 flex-1 sm:flex-none min-w-0"
          >
            <span className="text-xs sm:text-sm font-semibold">Forward</span>
          </button>
        )}
      </div>
    </div>
  );
};
