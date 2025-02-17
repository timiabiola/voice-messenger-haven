
import { Note, Folder } from '@/types/notes';

type NotesListProps = {
  notes: Note[];
  folders: Folder[];
  onNoteClick: (note: Note) => void;
};

export default function NotesList({ notes, folders, onNoteClick }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No notes found
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-16">
      {notes.map(note => (
        <div 
          key={note.id}
          className="glass-panel rounded-lg p-4 hover:bg-accent/10 cursor-pointer"
          onClick={() => onNoteClick(note)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {new Date(note.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-foreground line-clamp-3">
            {note.content || 'Empty note'}
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-xs text-muted-foreground">
              {folders.find(f => f.id === note.folder_id)?.name || 'Uncategorized'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
