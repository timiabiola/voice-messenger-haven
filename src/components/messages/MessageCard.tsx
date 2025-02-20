
import { AlertTriangle, Lock, Play, Square, Forward } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

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
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Load audio with proper authentication
  const loadAudio = async () => {
    try {
      setIsLoading(true);
      
      // Check if we already have the audio blob
      if (audioBlob) {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const response = await fetch(message.audio_url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audio');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setAudioBlob(blobUrl);

      if (audioRef.current) {
        audioRef.current.src = blobUrl;
        await audioRef.current.load();
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      toast.error('Failed to load audio message');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioBlob) {
        URL.revokeObjectURL(audioBlob);
      }
    };
  }, [audioBlob]);

  const handlePlayback = async () => {
    if (!audioRef.current) {
      console.error('No audio element found');
      toast.error('Audio player not initialized');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      // Load audio if not already loaded
      if (!audioBlob) {
        await loadAudio();
      }

      // Reset audio position if needed
      if (audioRef.current.currentTime > 0) {
        audioRef.current.currentTime = 0;
      }

      // Play audio
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      toast.error('Failed to play audio message');
      setIsPlaying(false);
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
    console.error('Audio playback error:', {
      error: audioRef.current?.error,
      event: event,
      src: audioRef.current?.currentSrc
    });
    setIsPlaying(false);
    setIsLoading(false);
    toast.error('Error playing audio message');
    // Attempt to reload audio on error
    loadAudio();
  };

  const senderName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || message.sender.email;

  return (
    <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 space-y-4">
      <audio 
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="none"
        playsInline // Important for iOS
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
