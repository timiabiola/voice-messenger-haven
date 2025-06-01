import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatDuration } from '@/utils/audio';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  existingAudioUrl?: string;
  existingDuration?: number;
  onDelete?: () => void;
  readOnly?: boolean;
}

export const VoiceRecorder = ({
  onRecordingComplete,
  existingAudioUrl,
  existingDuration,
  onDelete,
  readOnly = false,
}: VoiceRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (existingAudioUrl) {
      setAudioUrl(existingAudioUrl);
      setDuration(existingDuration || 0);
    }
  }, [existingAudioUrl, existingDuration]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Clean up blob URLs to prevent memory leaks
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (readOnly) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(finalDuration);
        onRecordingComplete(audioBlob, finalDuration);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      startTimeRef.current = Date.now();
      setIsRecording(true);
      
      // Update duration every second
      intervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not access microphone. Please check permissions."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        toast({
          variant: "destructive",
          title: "Playback Error",
          description: "Could not play audio. The file may be corrupted or unavailable."
        });
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
          toast({
            variant: "destructive",
            title: "Playback Error",
            description: "Could not start playback. Please try again."
          });
        });
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clean up blob URL if it exists
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    
    // Call the onDelete callback if provided
    if (onDelete) {
      onDelete();
    }
  };

  // Mobile layout - larger touch targets
  if (isMobile) {
    return (
      <div className="space-y-4">
        {!isRecording && !audioUrl ? (
          <Button
            onClick={startRecording}
            size="lg"
            variant="outline"
            className="w-full gap-2"
            disabled={readOnly}
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </Button>
        ) : isRecording ? (
          <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording...</span>
              <span className="text-sm text-muted-foreground">
                {formatDuration(duration)}
              </span>
            </div>
            <Button
              onClick={stopRecording}
              size="icon"
              variant="destructive"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        ) : audioUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
              <Button
                onClick={togglePlayback}
                size="icon"
                variant="outline"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Voice Note</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(duration)}
                </span>
              </div>
              {!readOnly && (
                <Button
                  onClick={deleteRecording}
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Desktop layout - enhanced with better UX
  return (
    <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-lg border border-border/50 hover:border-border/80 transition-colors">
      {!isRecording && !audioUrl ? (
        <Button
          onClick={startRecording}
          variant="outline"
          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          disabled={readOnly}
        >
          <Mic className="w-4 h-4" />
          Record Voice Note
        </Button>
      ) : isRecording ? (
        <>
          <Button
            onClick={stopRecording}
            size="default"
            variant="destructive"
            className="animate-pulse hover:animate-none"
          >
            <Square className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
            <span className="text-sm text-muted-foreground">
              {formatDuration(duration)}
            </span>
          </div>
        </>
      ) : audioUrl ? (
        <>
          <Button
            onClick={togglePlayback}
            variant="outline"
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Voice Note</span>
            <span className="text-sm text-muted-foreground">
              • {formatDuration(duration)}
            </span>
          </div>
          {!readOnly && (
            <Button
              onClick={deleteRecording}
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </>
      ) : null}
    </div>
  );
}; 