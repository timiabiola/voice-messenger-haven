import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { PencilLine, Settings, Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import FolderSidebar from '@/components/notes/FolderSidebar';
import NoteEditor from '@/components/notes/NoteEditor';
import NoteViewer from '@/components/notes/NoteViewer';
import NotesHeader from '@/components/notes/NotesHeader';
import NotesList from '@/components/notes/NotesList';
import { NotesLayout } from '@/components/notes/NotesLayout';
import { useNotes } from '@/hooks/useNotes';
import { useNoteState } from '@/hooks/useNoteState';
import { useNoteTags } from '@/hooks/useNoteTags';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ensureStorageBucket } from '@/lib/supabase-storage';

const MOBILE_BREAKPOINT = 768;

export default function Notes() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { isAdmin } = useAdmin();

  const {
    notes,
    folders,
    isLoading,
    createFolder,
    createNote,
    updateNote,
    deleteNote
  } = useNotes(userId);

  const { tags } = useNoteTags(userId);

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
    toggleFolder,
    setCurrentNote
  } = useNoteState();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserId(user.id);
      
      // Check if voice recordings bucket exists
      const bucketExists = await ensureStorageBucket();
      if (!bucketExists) {
        console.warn('[Notes] Voice recordings bucket not found - voice notes may not work');
      }
    };

    getCurrentUser();
  }, [navigate]);

  const filteredNotes = notes.filter(note => {
    const matchesFolder = activeFolder ? note.folder_id === activeFolder : true;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // TODO: Add tag filtering once note tags are loaded with notes
    const matchesTags = selectedTags.length === 0; // For now, show all if no tags selected
    
    return matchesFolder && matchesSearch && matchesTags;
  });

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      await createFolder(folderName);
    }
  };

  const handleSaveNote = async (audioUrl?: string, duration?: number) => {
    if (!currentNote.title && !currentNote.content && !audioUrl) return;
    
    const result = selectedNote
      ? await updateNote(selectedNote.id, { 
          title: currentNote.title, 
          content: currentNote.content,
          audio_url: audioUrl,
          duration: duration
        })
      : await createNote(currentNote.title, currentNote.content, activeFolder, audioUrl, duration);

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

  const handleNavigateToLoadTest = () => {
    navigate('/load-test');
  };

  const handleNoteChange = (field: 'title' | 'content', value: string) => {
    setCurrentNote(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMoveNote = async (noteId: string, folderId: string | null) => {
    await updateNote(noteId, { folder_id: folderId });
  };

  const sidebar = (
    <FolderSidebar
      folders={folders}
      notes={notes}
      activeFolder={activeFolder}
      expandedFolders={expandedFolders}
      onFolderClick={setActiveFolder}
      onToggleFolder={toggleFolder}
      onCreateFolder={handleCreateFolder}
      setActiveFolder={setActiveFolder}
      tags={tags}
      selectedTags={selectedTags}
      onToggleTag={handleToggleTag}
    />
  );

  const list = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <NotesHeader
            selectedNoteId={selectedNote?.id || null}
            activeFolder={activeFolder}
            folders={folders}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateNote={startNewNote}
          />
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleNavigateToLoadTest}>
                  Load Testing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            <NotesList
              notes={filteredNotes}
              folders={folders}
              onNoteClick={setSelectedNote}
            />
            
            {/* Floating create button - visible when not editing or viewing */}
            {!isEditing && !selectedNote && (
              <button
                onClick={startNewNote}
                className="fixed md:absolute bottom-20 md:bottom-6 right-6 p-3 rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-lg z-10"
                title="Create new note"
              >
                <PencilLine className="w-5 h-5 text-primary-foreground" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  const editor = selectedNote && !isEditing ? (
    <NoteViewer
      note={selectedNote}
      folders={folders}
      userId={userId}
      onClose={() => setSelectedNote(null)}
      onEdit={() => startEditNote(selectedNote)}
      onDelete={() => handleDeleteNote()}
      onMove={handleMoveNote}
      onNewNote={startNewNote}
    />
  ) : isEditing ? (
    <NoteEditor
      isEditing={isEditing}
      selectedNote={selectedNote}
      currentNote={currentNote}
      userId={userId}
      onCancel={resetNoteState}
      onSave={handleSaveNote}
      onChange={handleNoteChange}
    />
  ) : null;

  return (
    <AppLayout>
      <NotesLayout
        sidebar={sidebar}
        list={list}
        editor={editor}
        showEditor={!!selectedNote || isEditing}
        onCloseEditor={() => {
          setSelectedNote(null);
          resetNoteState();
        }}
      />
    </AppLayout>
  );
}
