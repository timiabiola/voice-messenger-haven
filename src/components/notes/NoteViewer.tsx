
import { X, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Note, Folder } from '@/types/notes';

type NoteViewerProps = {
  note: Note;
  folders: Folder[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function NoteViewer({
  note,
  folders,
  onClose,
  onEdit,
  onDelete,
}: NoteViewerProps) {
  return (
    <div className="glass-panel rounded-lg p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {note.title}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {new Date(note.created_at).toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {folders.find(f => f.id === note.folder_id)?.name || 'Uncategorized'}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
        >
          <X className="w-4 h-4 mr-1" />
          Close
        </Button>
      </div>
      <div className="prose prose-invert max-w-none mb-16">
        <div className="whitespace-pre-wrap text-foreground">
          {note.content}
        </div>
      </div>
      <div className="absolute bottom-6 right-6 flex space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-accent/10 hover:bg-accent/20"
          onClick={onEdit}
          title="Edit note"
        >
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-accent/10 hover:bg-accent/20"
          onClick={onDelete}
          title="Delete note"
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
