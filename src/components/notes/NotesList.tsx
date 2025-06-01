import { Note, Folder } from '@/types/notes';
import { FileText, Mic, Clock } from 'lucide-react';
import { formatDuration } from '@/utils/audio';

type NotesListProps = {
  notes: Note[];
  folders: Folder[];
  onNoteClick: (note: Note) => void;
};

export default function NotesList({ notes, folders, onNoteClick }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No notes found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first note to get started
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold mb-4">All Notes</h2>
      {notes.map(note => (
        <div 
          key={note.id}
          className="glass-panel rounded-lg p-4 hover:bg-accent/10 cursor-pointer transition-all hover:shadow-md group"
          onClick={() => onNoteClick(note)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {note.type === 'voice' ? (
                  <Mic className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <h3 className="font-medium text-foreground truncate">
                  {note.title || 'Untitled Note'}
                </h3>
              </div>
              
              {note.type === 'voice' && note.duration ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(note.duration)}</span>
                </div>
              ) : note.content ? (
                <p className="text-sm text-muted-foreground line-clamp-2 ml-6">
                  {note.content}
                </p>
              ) : null}
              
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 ml-6">
                  {note.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderWidth: '1px',
                        borderColor: tag.color + '40'
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 ml-6">
            <span className="text-xs text-muted-foreground">
              {folders.find(f => f.id === note.folder_id)?.name || 'No folder'}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(note.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
