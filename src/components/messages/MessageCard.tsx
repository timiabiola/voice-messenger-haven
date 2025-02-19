
import { AlertTriangle, Lock, Play, Square, Forward } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface MessageCardProps {
  message: {
    id: string;
    title: string;
    subject: string;
    audio_url: string;
    created_at: string;
    is_urgent: boolean;
    is_private: boolean;
    sender: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
}

export const MessageCard = ({ message }: MessageCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Pre-load the audio when component mounts
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [message.audio_url]);

  const handlePlayback = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        // Ensure audio is loaded
        await audioRef.current.load();
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play audio message');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio playback error:', event);
    setIsPlaying(false);
    setIsLoading(false);
    toast.error('Error playing audio message');
  };

  const senderName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || message.sender.email;

  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-4">
      <audio 
        ref={audioRef}
        src={message.audio_url}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="none"
        className="hidden"
      />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-amber-400 mb-1 truncate">{message.subject}</h3>
          <p className="text-sm text-gray-400 truncate">From: {senderName}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {message.is_urgent && (
            <span className="shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </span>
          )}
          {message.is_private && (
            <span className="shrink-0">
              <Lock className="w-4 h-4 text-amber-400" />
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePlayback}
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
    </div>
  );
};
