import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatDuration } from '@/utils/audio';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  existingAudioUrl?: string;
  existingDuration?: number;
}

export const VoiceRecorder = ({
  onRecordingComplete,
  existingAudioUrl,
  existingDuration,
}: VoiceRecorderProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

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
      }
    };
  }, []);

  const startRecording = async () => {
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
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-lg">
      {!isRecording && !audioUrl ? (
        <Button
          onClick={startRecording}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <Mic className="w-4 h-4" />
          Record Voice Note
        </Button>
      ) : isRecording ? (
        <>
          <Button
            onClick={stopRecording}
            size="icon"
            variant="destructive"
            className="animate-pulse"
          >
            <Square className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Recording... {formatDuration(duration)}
          </span>
        </>
      ) : audioUrl ? (
        <>
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
          <span className="text-sm text-muted-foreground flex-1">
            Voice Note • {formatDuration(duration)}
          </span>
          <Button
            onClick={deleteRecording}
            size="icon"
            variant="ghost"
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      ) : null}
    </div>
  );
}; 