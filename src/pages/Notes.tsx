
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Search, Plus, PencilLine } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import FolderSidebar from '@/components/notes/FolderSidebar';
import NoteEditor from '@/components/notes/NoteEditor';
import NoteViewer from '@/components/notes/NoteViewer';
import { Note, Folder } from '@/types/notes';

export default function Notes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        const { data: foldersData, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId)
          .order('name');

        if (foldersError) throw foldersError;
        setFolders(foldersData || []);

        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;
        setNotes(notesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load notes and folders"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, toast]);

  const filteredNotes = notes.filter(note => {
    const matchesFolder = activeFolder ? note.folder_id === activeFolder : true;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const handleCreateFolder = async () => {
    if (!userId) return;
    
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: folderName,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Folder created successfully"
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder"
      });
    }
  };

  const handleCreateNote = () => {
    if (!userId) return;
    setIsEditing(true);
    setCurrentNote({ title: '', content: '' });
  };

  const handleSaveNote = async () => {
    if (!userId || !currentNote.content) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: currentNote.content.split('\n')[0] || 'Untitled Note',
          content: currentNote.content,
          folder_id: activeFolder,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setIsEditing(false);
      setCurrentNote({ title: '', content: '' });
      toast({
        title: "Success",
        description: "Note created successfully"
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create note"
      });
    }
  };

  const handleUpdateNote = async () => {
    if (!userId || !currentNote.content || !selectedNote) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: currentNote.content.split('\n')[0] || 'Untitled Note',
          content: currentNote.content,
        })
        .eq('id', selectedNote.id)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === selectedNote.id ? data : note
      ));
      setIsEditing(false);
      setCurrentNote({ title: '', content: '' });
      setSelectedNote(null);
      toast({
        title: "Success",
        description: "Note updated successfully"
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update note"
      });
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', selectedNote.id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== selectedNote.id));
      setSelectedNote(null);
      toast({
        title: "Success",
        description: "Note deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note"
      });
    }
  };

  const handleEditNote = () => {
    if (!selectedNote) return;
    setIsEditing(true);
    setCurrentNote({
      title: selectedNote.title,
      content: selectedNote.content
    });
    setSelectedNote(null);
  };

  const handleCloseReadView = () => {
    setSelectedNote(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentNote({ title: '', content: '' });
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(false);
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
          onToggleFolder={(folderId) => {
            setExpandedFolders(current => 
              current.includes(folderId)
                ? current.filter(id => id !== folderId)
                : [...current, folderId]
            );
          }}
          onCreateFolder={handleCreateFolder}
          setActiveFolder={setActiveFolder}
        />

        <main className="flex-1 flex flex-col glass-panel rounded-lg">
          <header className="h-16 flex items-center justify-between px-4 border-b border-border">
            <h1 className="text-xl font-semibold text-foreground">
              {selectedNote ? 'Reading Note' : 
                activeFolder 
                  ? folders.find(f => f.id === activeFolder)?.name || 'Notes'
                  : 'All Notes'
              }
            </h1>
            <div className="flex items-center space-x-2">
              {!selectedNote && (
                <>
                  <div className="relative">
                    <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search notes..."
                      className="pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    className="p-2 hover:bg-accent/10 rounded-full"
                    onClick={handleCreateNote}
                  >
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 relative">
            {selectedNote ? (
              <NoteViewer
                note={selectedNote}
                folders={folders}
                onClose={handleCloseReadView}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
              />
            ) : isEditing ? (
              <NoteEditor
                isEditing={isEditing}
                selectedNote={selectedNote}
                currentNote={currentNote}
                onCancel={handleCancelEdit}
                onSave={selectedNote ? handleUpdateNote : handleSaveNote}
                onChange={(content) => setCurrentNote(prev => ({ ...prev, content }))}
              />
            ) : (
              <>
                <button
                  onClick={handleCreateNote}
                  className="absolute top-6 left-6 p-3 rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-lg"
                  title="Create new note"
                >
                  <PencilLine className="w-5 h-5 text-primary-foreground" />
                </button>

                {isLoading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    {searchQuery ? 'No notes found' : 'No notes yet'}
                  </div>
                ) : (
                  <div className="space-y-4 mt-16">
                    {filteredNotes.map(note => (
                      <div 
                        key={note.id}
                        className="glass-panel rounded-lg p-4 hover:bg-accent/10 cursor-pointer"
                        onClick={() => handleNoteClick(note)}
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
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
