import { formatDistanceToNow } from 'date-fns';
import { Play, Square, MoreVertical } from 'lucide-react';
import { useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSaveMessage } from '@/hooks/useSaveMessage';
import { toast } from 'sonner';

interface SavedMessageCardProps {
  savedItem: {
    id: string;
    saved_at?: string;
    created_at?: string;
    voice_message: {
      id: string;
      subject?: string;
      audio_url: string;
      created_at: string;
      sender?: {
        id: string;
        first_name?: string;
        last_name?: string;
        email: string;
      };
    };
  };
}

export const SavedMessageCard = ({ savedItem }: SavedMessageCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { unsaveMessage } = useSaveMessage();

  const senderName = savedItem.voice_message.sender
    ? `${savedItem.voice_message.sender.first_name || ''} ${savedItem.voice_message.sender.last_name || ''}`.trim() || savedItem.voice_message.sender.email
    : 'Unknown Sender';

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleUnsave = () => {
    unsaveMessage(savedItem.voice_message.id);
  };

  return (
    <div className="glass-panel rounded-lg p-4 space-y-3">
      <audio
        ref={audioRef}
        src={savedItem.voice_message.audio_url}
        onEnded={handleAudioEnded}
        preload="none"
        className="hidden"
      />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-amber-400 mb-1 truncate">
            {savedItem.voice_message.subject || 'Voice Message'}
          </h3>
          <p className="text-sm text-gray-400 truncate">From: {senderName}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500">
              Sent {formatDistanceToNow(new Date(savedItem.voice_message.created_at), { addSuffix: true })}
            </p>
            {savedItem.saved_at && (
              <>
                <span className="text-xs text-gray-600">•</span>
                <p className="text-xs text-gray-500">
                  Saved {formatDistanceToNow(new Date(savedItem.saved_at), { addSuffix: true })}
                </p>
              </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 hover:bg-zinc-800 rounded-full transition-colors">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleUnsave} className="text-red-400">
              Remove from saved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-black rounded-full text-sm font-medium hover:bg-amber-300 transition-colors active:scale-95 disabled:opacity-50"
        >
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isLoading ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}</span>
        </button>
      </div>
    </div>
  );
}; 