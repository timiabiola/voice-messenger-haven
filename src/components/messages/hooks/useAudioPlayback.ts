
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthSession } from './useAuthSession';
import { useMobileInteraction } from './useMobileInteraction';
import { useAudioBlob } from './useAudioBlob';

export const useAudioPlayback = (audio_url: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryTimeoutRef = useRef<number>();
  const previousUrlRef = useRef<string>(audio_url);
  const navigate = useNavigate();
  
  const { validateAndRefreshSession } = useAuthSession();
  const { userInteracted, setUserInteracted, isMobile } = useMobileInteraction();
  const { audioBlob, createBlob, clearBlob } = useAudioBlob();

  // Reset playback rate to 1x when audio URL actually changes (new message)
  useEffect(() => {
    // Only reset if the URL actually changed (not just a re-render)
    if (previousUrlRef.current !== audio_url) {
      setPlaybackRate(1);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.playbackRate = 1;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      previousUrlRef.current = audio_url;
    }
  }, [audio_url]);

  // Update current time and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
    };
  }, []);

  // Apply playback rate when audio element is ready
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const applyPlaybackRate = () => {
      if (audio.readyState >= 1) {
        audio.playbackRate = playbackRate;
      }
    };

    // Apply immediately if ready
    applyPlaybackRate();

    // Also apply when audio loads
    audio.addEventListener('loadeddata', applyPlaybackRate);
    audio.addEventListener('canplay', applyPlaybackRate);

    return () => {
      audio.removeEventListener('loadeddata', applyPlaybackRate);
      audio.removeEventListener('canplay', applyPlaybackRate);
    };
  }, [playbackRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
      clearBlob();
    };
  }, [clearBlob]);

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
          'Cache-Control': 'no-cache',
          'Accept': 'audio/webm,audio/mp4,audio/*;q=0.9,*/*;q=0.8'
        }
      });

      if (response.status === 401 || response.status === 403) {
        // Auth error when fetching audio
        toast.error('Authentication error. Please sign in again.');
        navigate('/auth');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      // Log content type for debugging
      const contentType = response.headers.get('content-type');
      console.log('Audio content type:', contentType);

      const blobUrl = await createBlob(response);

      if (audioRef.current) {
        // Let the browser handle format selection through source elements
        // Apply current playback rate
        audioRef.current.playbackRate = playbackRate;
        // Load the new audio
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
          try {
            // Initialize audio on first interaction for iOS
            await audioRef.current.play();
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          } catch (error) {
            console.error('Mobile playback test failed:', error);
          }
        }
      }

      if (!audioBlob) {
        await loadAudio();
      }

      if (!audioRef.current) {
        throw new Error('Audio player not initialized');
      }

      // Don't reset to 0 if already started - maintain current position
      // Only reset if this is the first play
      if (!hasStarted && audioRef.current.currentTime > 0) {
        audioRef.current.currentTime = 0;
      }

      // Ensure playback rate is applied before playing
      audioRef.current.playbackRate = playbackRate;

      await audioRef.current.play();
      setIsPlaying(true);
      setHasStarted(true);

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
    const errorDetails = {
      error: audioRef.current?.error,
      event: event,
      src: audioRef.current?.currentSrc,
      readyState: audioRef.current?.readyState,
      sources: Array.from(audioRef.current?.getElementsByTagName('source') || []).map(source => ({
        src: source.src,
        type: source.type
      }))
    };
    
    console.error('Audio playback error:', errorDetails);
    
    setIsPlaying(false);
    setIsLoading(false);
    
    if (isMobile) {
      clearBlob();
      // Retry loading after a delay on mobile
      retryTimeoutRef.current = window.setTimeout(() => {
        loadAudio();
      }, 1000);
    } else {
      toast.error('Error playing audio message');
      clearBlob();
      loadAudio();
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      // Save preference to localStorage
      localStorage.setItem('preferredPlaybackRate', speed.toString());
    }
  };

  const handleSkipBackward = (seconds: number = 10) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - seconds);
    }
  };

  const handleSkipForward = (seconds: number = 10) => {
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + seconds, duration);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  return {
    isPlaying,
    isLoading,
    hasStarted,
    audioRef,
    handlePlayback,
    handleAudioEnded,
    handleAudioError,
    playbackRate,
    currentTime,
    duration,
    handleSpeedChange,
    handleSkipBackward,
    handleSkipForward,
    handleSeek
  };
};
