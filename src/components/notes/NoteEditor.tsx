import { useState } from 'react';
import { X, Mic, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { VoiceRecorder } from './VoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  if (!isEditing) return null;

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
  };

  const handleSave = async () => {
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

        await onSave(publicUrl, audioDuration);
      } catch (error) {
        console.error('Error uploading audio:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to upload voice recording"
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      await onSave();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with actions */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {selectedNote ? 'Edit Note' : 'New Note'}
        </h2>
        
        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            {isVoiceMode ? 'Text Mode' : 'Voice Mode'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : selectedNote ? 'Update' : 'Save'}
          </Button>
        </div>

        {/* Mobile buttons - more compact */}
        <div className="flex md:hidden items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVoiceMode(!isVoiceMode)}
          >
            <Mic className={`w-5 h-5 ${isVoiceMode ? 'text-primary' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onCancel}
          >
            <X className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isUploading}
          >
            <Save className="w-5 h-5" />
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
            className="focus:ring-1 focus:ring-primary"
          />
          
          {isVoiceMode ? (
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              existingAudioUrl={selectedNote?.audio_url}
              existingDuration={selectedNote?.duration}
            />
          ) : (
            <Textarea
              placeholder="Start writing your note here..."
              value={currentNote.content}
              onChange={(e) => onChange('content', e.target.value)}
              className="min-h-[200px] md:min-h-[400px] resize-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>
      </div>
    </div>
  );
}
