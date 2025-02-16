
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Search, Plus, Folder, File, ChevronRight, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type Note = {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

type Folder = {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function Notes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch folders and notes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch folders
        const { data: foldersData, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .order('name');

        if (foldersError) throw foldersError;
        setFolders(foldersData || []);

        // Fetch notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
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
  }, [toast]);

  // Filter notes based on active folder and search query
  const filteredNotes = notes.filter(note => {
    const matchesFolder = activeFolder ? note.folder_id === activeFolder : true;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  // Get folders structure
  const getRootFolders = () => folders.filter(folder => !folder.parent_folder_id);
  const getChildFolders = (parentId: string) => folders.filter(folder => folder.parent_folder_id === parentId);
  const getFolderNoteCount = (folderId: string) => notes.filter(note => note.folder_id === folderId).length;

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(current => 
      current.includes(folderId)
        ? current.filter(id => id !== folderId)
        : [...current, folderId]
    );
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name: folderName }])
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

  const handleCreateNote = async () => {
    const noteTitle = prompt('Enter note title:');
    if (!noteTitle) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title: noteTitle,
          content: '',
          folder_id: activeFolder
        }])
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
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

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left Sidebar */}
        <aside className="hidden md:flex w-64 flex-col glass-panel rounded-lg mr-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground">Notes</h2>
              <button 
                className="p-2 hover:bg-accent/10 rounded-full"
                onClick={handleCreateFolder}
              >
                <Plus className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Folder Structure */}
            <div className="space-y-4">
              <button 
                className={`flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/10 ${
                  !activeFolder ? 'bg-accent/10' : ''
                }`}
                onClick={() => setActiveFolder(null)}
              >
                <div className="flex items-center space-x-3">
                  <Folder className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">All Notes</span>
                </div>
                <span className="text-sm text-muted-foreground">{notes.length}</span>
              </button>

              {/* Root Folders */}
              {getRootFolders().map(folder => (
                <div key={folder.id}>
                  <button 
                    className={`flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/10 ${
                      activeFolder === folder.id ? 'bg-accent/10' : ''
                    }`}
                    onClick={() => toggleFolder(folder.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="w-5 h-5 text-primary" />
                      <span className="text-foreground">{folder.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {getFolderNoteCount(folder.id)}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transform transition-transform ${
                        expandedFolders.includes(folder.id) ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </button>

                  {expandedFolders.includes(folder.id) && (
                    <div className="ml-4 mt-2 space-y-2">
                      {getChildFolders(folder.id).map(childFolder => (
                        <button 
                          key={childFolder.id}
                          className={`flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/10 ${
                            activeFolder === childFolder.id ? 'bg-accent/10' : ''
                          }`}
                          onClick={() => setActiveFolder(childFolder.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <File className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{childFolder.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {getFolderNoteCount(childFolder.id)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col glass-panel rounded-lg">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 border-b border-border">
            <h1 className="text-xl font-semibold text-foreground">
              {activeFolder 
                ? folders.find(f => f.id === activeFolder)?.name || 'Notes'
                : 'All Notes'
              }
            </h1>
            <div className="flex items-center space-x-2">
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
            </div>
          </header>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center text-muted-foreground">
                {searchQuery ? 'No notes found' : 'No notes yet'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map(note => (
                  <div 
                    key={note.id}
                    className="glass-panel rounded-lg p-4 hover:bg-accent/10 cursor-pointer"
                    onClick={() => {
                      // TODO: Implement note editing
                      console.log('Open note:', note.id);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{note.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.content || 'No content'}
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
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
