
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type NoteEditorProps = {
  isEditing: boolean;
  selectedNote: { id: string } | null;
  currentNote: {
    title: string;
    content: string;
  };
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: 'title' | 'content', value: string) => void;
};

export default function NoteEditor({
  isEditing,
  selectedNote,
  currentNote,
  onCancel,
  onSave,
  onChange,
}: NoteEditorProps) {
  if (!isEditing) return null;

  return (
    <div className="glass-panel rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">
          {selectedNote ? 'Edit Note' : 'New Note'}
        </h2>
        <div className="flex space-x-2">
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
            onClick={onSave}
          >
            {selectedNote ? 'Update Note' : 'Save Note'}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <Input
          placeholder="Note title"
          value={currentNote.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="focus:ring-1 focus:ring-primary"
        />
        <Textarea
          placeholder="Start writing your note here..."
          value={currentNote.content}
          onChange={(e) => onChange('content', e.target.value)}
          className="min-h-[200px] focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}
