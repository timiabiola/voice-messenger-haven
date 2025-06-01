import { useState, useEffect } from 'react';
import { X, Mic, Save, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { VoiceRecorder } from './VoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type NoteEditorProps = {
  isEditing: boolean;
  selectedNote: { id: string; audio_url?: string; duration?: number } | null;
  currentNote: {
    title: string;
    content: string;
  };
  userId: string | null;
  onCancel: () => void;
  onSave: (audioUrl?: string, duration?: number) => void;
  onChange: (field: 'title' | 'content', value: string) => void;
};

export default function NoteEditor({
  isEditing,
  selectedNote,
  currentNote,
  userId,
  onCancel,
  onSave,
  onChange,
}: NoteEditorProps) {
  const { toast } = useToast();
  // Initialize voice mode based on whether we're editing a voice note
  const [isVoiceMode, setIsVoiceMode] = useState(() => {
    return selectedNote?.audio_url ? true : false;
  });
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  // New state to track existing audio
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | undefined>(selectedNote?.audio_url);
  const [existingDuration, setExistingDuration] = useState<number | undefined>(selectedNote?.duration);
  const [shouldDeleteExistingAudio, setShouldDeleteExistingAudio] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update existing audio when selectedNote changes
  useEffect(() => {
    if (selectedNote?.audio_url) {
      setExistingAudioUrl(selectedNote.audio_url);
      setExistingDuration(selectedNote.duration);
      setShouldDeleteExistingAudio(false);
    } else {
      setExistingAudioUrl(undefined);
      setExistingDuration(undefined);
    }
  }, [selectedNote]);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (isMobile || !isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape to cancel
      else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isEditing, onCancel]);

  if (!isEditing) return null;

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
  };

  const handleExistingAudioDelete = () => {
    setShouldDeleteExistingAudio(true);
    setExistingAudioUrl(undefined);
    setExistingDuration(undefined);
  };

  const handleSave = async () => {
    let finalAudioUrl = existingAudioUrl;
    let finalDuration = existingDuration;

    // If we have a new recording, upload it
    if (isVoiceMode && audioBlob && userId) {
      setIsUploading(true);
      try {
        // Upload audio to Supabase storage
        const fileName = `voice-notes/${userId}/${Date.now()}.webm`;
        const { data, error } = await supabase.storage
          .from('voice-recordings')
          .upload(fileName, audioBlob);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('voice-recordings')
          .getPublicUrl(fileName);

        finalAudioUrl = publicUrl;
        finalDuration = audioDuration;
      } catch (error) {
        console.error('Error uploading audio:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload voice recording"
        });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else if (shouldDeleteExistingAudio) {
      // Clear audio if it was deleted
      finalAudioUrl = undefined;
      finalDuration = undefined;
    }

    // Save the note with the appropriate audio URL
    await onSave(finalAudioUrl, finalDuration);
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioDuration(0);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with actions */}
      <div className="flex items-center justify-between p-4 border-b border-border gap-2">
        {/* Mobile back/cancel button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="min-[480px]:hidden flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <h2 className="text-lg font-semibold flex-1 truncate">
          {selectedNote ? 'Edit Note' : 'New Note'}
        </h2>
        
        {/* Desktop cancel button only - keep in header */}
        <div className="hidden min-[480px]:flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Cancel (Esc)"
          >
            Cancel
          </Button>
        </div>

        {/* Mobile buttons in header - only on very small screens */}
        <div className="flex min-[480px]:hidden items-center gap-2">
          <Button
            variant={isVoiceMode ? "default" : "outline"}
            size="icon"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className="flex-shrink-0"
            title={isVoiceMode ? "Switch to text mode" : "Switch to voice mode"}
          >
            <Mic className={`w-5 h-5 ${isVoiceMode ? '' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <Input
            placeholder="Note title"
            value={currentNote.title}
            onChange={(e) => onChange('title', e.target.value)}
            className="text-lg font-medium"
          />
          
          {isVoiceMode ? (
            <div className="space-y-4">
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                existingAudioUrl={existingAudioUrl}
                existingDuration={existingDuration}
                onDelete={handleExistingAudioDelete}
              />
              
              {/* Optional text note with voice */}
              <Textarea
                placeholder="Add optional text notes..."
                value={currentNote.content}
                onChange={(e) => onChange('content', e.target.value)}
                className="min-h-[100px] resize-none"
              />
              
              {audioBlob && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAudio}
                  className="w-full gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Recording
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Show existing voice recording in text mode */}
              {existingAudioUrl && !shouldDeleteExistingAudio && (
                <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Existing voice recording:</p>
                  <VoiceRecorder
                    onRecordingComplete={() => {}}
                    existingAudioUrl={existingAudioUrl}
                    existingDuration={existingDuration}
                    onDelete={handleExistingAudioDelete}
                    readOnly={true}
                  />
                </div>
              )}
              
              <Textarea
                placeholder="Start writing your note here..."
                value={currentNote.content}
                onChange={(e) => onChange('content', e.target.value)}
                className="min-h-[200px] md:min-h-[400px] resize-none"
                autoFocus
              />
            </>
          )}
        </div>
      </div>

      {/* Desktop buttons below content - show on screens 480px and up */}
      <div className="hidden min-[480px]:flex items-center justify-end gap-2 p-4 border-t border-border">
        <Button
          variant="outline"
          size="default"
          onClick={() => setIsVoiceMode(!isVoiceMode)}
          className={cn(
            "gap-2 transition-colors",
            isVoiceMode 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "hover:bg-accent hover:text-accent-foreground"
          )}
          title={isVoiceMode ? "Switch to text mode" : "Switch to voice mode"}
        >
          <Mic className="w-4 h-4" />
          {isVoiceMode ? 'Text Mode' : 'Voice Mode'}
        </Button>
        <Button 
          size="default" 
          onClick={handleSave}
          disabled={isUploading}
          className="hover:bg-primary/90 transition-colors"
          title="Save note (Ctrl+S)"
        >
          {isUploading ? 'Uploading...' : 'Save Note'}
        </Button>
      </div>

      {/* Mobile floating buttons - only show on small screens */}
      <div className="min-[480px]:hidden">
        {/* Voice/Text toggle button */}
        <div className="fixed bottom-20 left-4 z-50">
          <Button
            size="lg"
            variant={isVoiceMode ? "default" : "outline"}
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className="rounded-full w-14 h-14 shadow-lg"
            title={isVoiceMode ? "Switch to text mode" : "Switch to voice mode"}
          >
            <Mic className={`w-5 h-5 ${isVoiceMode ? '' : 'text-muted-foreground'}`} />
          </Button>
        </div>
        
        {/* Save button */}
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isUploading}
            className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          >
            <Save className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
