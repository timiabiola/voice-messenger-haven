
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import FolderSidebar from '@/components/notes/FolderSidebar';
import NoteEditor from '@/components/notes/NoteEditor';
import NoteViewer from '@/components/notes/NoteViewer';
import NotesHeader from '@/components/notes/NotesHeader';
import NotesList from '@/components/notes/NotesList';
import { useNotes } from '@/hooks/useNotes';
import { useNoteState } from '@/hooks/useNoteState';

export default function Notes() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  const {
    notes,
    folders,
    isLoading,
    createFolder,
    createNote,
    updateNote,
    deleteNote
  } = useNotes(userId);

  const {
    isEditing,
    currentNote,
    selectedNote,
    activeFolder,
    expandedFolders,
    searchQuery,
    setSearchQuery,
    setActiveFolder,
    setSelectedNote,
    resetNoteState,
    startNewNote,
    startEditNote,
    toggleFolder
  } = useNoteState();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserId(user.id);
    };

    getCurrentUser();
  }, [navigate]);

  const filteredNotes = notes.filter(note => {
    const matchesFolder = activeFolder ? note.folder_id === activeFolder : true;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      await createFolder(folderName);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote.content) return;
    
    const result = selectedNote
      ? await updateNote(selectedNote.id, currentNote.content)
      : await createNote(currentNote.content, activeFolder);

    if (result) {
      resetNoteState();
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote || !confirm('Are you sure you want to delete this note?')) return;
    
    const success = await deleteNote(selectedNote.id);
    if (success) {
      resetNoteState();
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)]">
        <FolderSidebar
          folders={folders}
          notes={notes}
          activeFolder={activeFolder}
          expandedFolders={expandedFolders}
          onFolderClick={setActiveFolder}
          onToggleFolder={toggleFolder}
          onCreateFolder={handleCreateFolder}
          setActiveFolder={setActiveFolder}
        />

        <main className="flex-1 flex flex-col glass-panel rounded-lg">
          <NotesHeader
            selectedNoteId={selectedNote?.id || null}
            activeFolder={activeFolder}
            folders={folders}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateNote={startNewNote}
          />

          <div className="flex-1 overflow-y-auto p-4 relative">
            {selectedNote ? (
              <NoteViewer
                note={selectedNote}
                folders={folders}
                onClose={() => setSelectedNote(null)}
                onEdit={() => startEditNote(selectedNote)}
                onDelete={handleDeleteNote}
              />
            ) : isEditing ? (
              <NoteEditor
                isEditing={isEditing}
                selectedNote={selectedNote}
                currentNote={currentNote}
                onCancel={resetNoteState}
                onSave={handleSaveNote}
                onChange={(content) => setCurrentNote(prev => ({ ...prev, content }))}
              />
            ) : (
              <>
                <button
                  onClick={startNewNote}
                  className="absolute top-6 left-6 p-3 rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-lg"
                  title="Create new note"
                >
                  <PencilLine className="w-5 h-5 text-primary-foreground" />
                </button>

                {isLoading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
                ) : (
                  <NotesList
                    notes={filteredNotes}
                    folders={folders}
                    onNoteClick={setSelectedNote}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
