
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

export const useAudioPlayback = (audio_url: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      const handleFirstTouch = () => {
        setUserInteracted(true);
        document.removeEventListener('touchstart', handleFirstTouch);
      };
      
      document.addEventListener('touchstart', handleFirstTouch);
      return () => document.removeEventListener('touchstart', handleFirstTouch);
    }
  }, [isMobile]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Session expired. Please sign in again.');
        navigate('/auth');
        return;
      }

      if (!session) {
        console.log('No active session found');
        navigate('/auth', { 
          state: { 
            returnTo: window.location.pathname,
            message: 'Please sign in to play audio messages'
          } 
        });
        return;
      }

      // Validate the session by making a test request
      const { error: validationError } = await supabase.auth.getUser();
      if (validationError) {
        console.error('Session validation error:', validationError);
        // Force refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          toast.error('Your session has expired. Please sign in again.');
          navigate('/auth');
          return;
        }
      }

      if (audioBlob && audioRef.current?.src === audioBlob) {
        setIsLoading(false);
        return;
      }

      console.log('Fetching audio with auth token');
      const response = await fetch(audio_url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (response.status === 401 || response.status === 403) {
        console.error('Auth error when fetching audio:', response.status);
        toast.error('Authentication error. Please sign in again.');
        navigate('/auth');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const blob = await response.blob();
      
      if (audioBlob) {
        URL.revokeObjectURL(audioBlob);
      }

      const blobUrl = URL.createObjectURL(blob);
      setAudioBlob(blobUrl);

      if (audioRef.current) {
        audioRef.current.src = blobUrl;
        await audioRef.current.load();
      }

      console.log('Audio loaded successfully');
    } catch (error) {
      console.error('Error loading audio:', error);
      
      // Check if it's an auth error
      if (error instanceof Error && 
          (error.message.includes('auth') || error.message.includes('401') || error.message.includes('403'))) {
        toast.error('Please sign in again to continue');
        navigate('/auth');
        return;
      }
      
      toast.error('Failed to load audio message');
      if (audioBlob) {
        URL.revokeObjectURL(audioBlob);
        setAudioBlob(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioBlob) {
        URL.revokeObjectURL(audioBlob);
      }
    };
  }, [audioBlob]);

  const handlePlayback = async () => {
    try {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      // First check session before any playback
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to play messages');
        navigate('/auth');
        return;
      }

      if (isMobile && !userInteracted) {
        setUserInteracted(true);
        if (audioRef.current) {
          await audioRef.current.play().catch(() => {});
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }

      if (!audioBlob) {
        await loadAudio();
      }

      if (!audioRef.current) {
        throw new Error('Audio player not initialized');
      }

      if (audioRef.current.currentTime > 0) {
        audioRef.current.currentTime = 0;
      }

      console.log('Starting playback');
      await audioRef.current.play();
      setIsPlaying(true);

    } catch (error) {
      console.error('Playback error:', error);
      
      // Handle auth errors specifically
      if (error instanceof Error && 
          (error.message.includes('auth') || error.message.includes('unauthorized'))) {
        toast.error('Please sign in again to continue');
        navigate('/auth');
        return;
      }
      
      toast.error('Failed to play audio message');
      setIsPlaying(false);
      
      if (error instanceof Error && error.message.includes('fetch')) {
        loadAudio();
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio playback error:', {
      error: audioRef.current?.error,
      event: event,
      src: audioRef.current?.currentSrc,
      readyState: audioRef.current?.readyState
    });
    setIsPlaying(false);
    setIsLoading(false);
    toast.error('Error playing audio message');

    if (audioBlob) {
      URL.revokeObjectURL(audioBlob);
      setAudioBlob(null);
    }
    loadAudio();
  };

  return {
    isPlaying,
    isLoading,
    audioRef,
    handlePlayback,
    handleAudioEnded,
    handleAudioError
  };
};
