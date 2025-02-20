
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthSession } from './useAuthSession';
import { useMobileInteraction } from './useMobileInteraction';
import { useAudioBlob } from './useAudioBlob';

export const useAudioPlayback = (audio_url: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  
  const { validateAndRefreshSession } = useAuthSession();
  const { userInteracted, setUserInteracted, isMobile } = useMobileInteraction();
  const { audioBlob, createBlob, clearBlob } = useAudioBlob();

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      
      const session = await validateAndRefreshSession();
      if (!session) return;

      if (audioBlob && audioRef.current?.src === audioBlob) {
        setIsLoading(false);
        return;
      }

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

      const blobUrl = await createBlob(response);

      if (audioRef.current) {
        audioRef.current.src = blobUrl;
        await audioRef.current.load();
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      
      if (error instanceof Error && 
          (error.message.includes('auth') || 
           error.message.includes('401') || 
           error.message.includes('403') ||
           error.message.includes('refresh_token_not_found'))) {
        toast.error('Please sign in again to continue');
        navigate('/auth');
        return;
      }
      
      toast.error('Failed to load audio message');
      clearBlob();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayback = async () => {
    try {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      const session = await validateAndRefreshSession();
      if (!session) return;

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

      await audioRef.current.play();
      setIsPlaying(true);

    } catch (error) {
      console.error('Playback error:', error);
      
      if (error instanceof Error && 
          (error.message.includes('auth') || 
           error.message.includes('unauthorized') ||
           error.message.includes('refresh_token_not_found'))) {
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
    clearBlob();
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
