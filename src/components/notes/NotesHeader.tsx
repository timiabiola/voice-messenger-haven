
import { Search, Plus } from 'lucide-react';
import { Folder } from '@/types/notes';

type NotesHeaderProps = {
  selectedNoteId: string | null;
  activeFolder: string | null;
  folders: Folder[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNote: () => void;
};

export default function NotesHeader({
  selectedNoteId,
  activeFolder,
  folders,
  searchQuery,
  onSearchChange,
  onCreateNote,
}: NotesHeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border">
      <h1 className="text-xl font-semibold text-foreground">
        {selectedNoteId ? 'Reading Note' : 
          activeFolder 
            ? folders.find(f => f.id === activeFolder)?.name || 'Notes'
            : 'All Notes'
        }
      </h1>
      <div className="flex items-center space-x-2">
        {!selectedNoteId && (
          <>
            <div className="relative">
              <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes..."
                className="pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <button 
              className="p-2 hover:bg-accent/10 rounded-full"
              onClick={onCreateNote}
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
