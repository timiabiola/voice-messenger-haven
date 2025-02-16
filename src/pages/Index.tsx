
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import CategoryTabs from '@/components/layout/CategoryTabs';
import EmptyState from '@/components/layout/EmptyState';
import { Search, Plus, Folder, File, ChevronRight, MoreVertical } from 'lucide-react';

type Note = {
  id: number;
  title: string;
  content: string;
  folder: string;
  timestamp: string;
  category: string;
}

type FolderItem = {
  id: string;
  label: string;
  count: number;
}

type FolderStructure = {
  [key: string]: FolderItem[];
}

export default function Home() {
  const [currentCategory, setCurrentCategory] = useState('inbox');
  const [messages] = useState({
    new: [],
    inbox: [],
    saved: Array(309).fill({}),
    trash: [],
  });

  // Notes related state
  const [activeFolder, setActiveFolder] = useState('all');
  const [expandedFolders, setExpandedFolders] = useState(['personal']);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample folder structure
  const folders: FolderStructure = {
    personal: [
      { id: 'meetings', label: 'Meetings', count: 5 },
      { id: 'ideas', label: 'Ideas', count: 3 },
      { id: 'tasks', label: 'Tasks', count: 8 }
    ]
  };

  // Sample note
  const note: Note = {
    id: 1,
    title: 'Meeting Notes - Product Review',
    content: 'Discussed new feature implementation and timeline...',
    folder: 'Meetings',
    timestamp: 'Today at 2:30 PM',
    category: 'Work'
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders(current => 
      current.includes(folder) 
        ? current.filter(f => f !== folder)
        : [...current, folder]
    );
  };

  return (
    <AppLayout>
      <div className="bg-black min-h-screen">
        <CategoryTabs
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
          counts={{
            new: messages.new.length,
            inbox: messages.inbox.length,
            saved: messages.saved.length,
            trash: messages.trash.length,
          }}
        />
        
        <div className="mt-28 px-4">
          {messages[currentCategory as keyof typeof messages]?.length === 0 ? (
            <div className="text-[#ffcc00]">
              <EmptyState />
            </div>
          ) : (
            <div className="flex h-[calc(100vh-8rem)]">
              {/* Left Sidebar */}
              <aside className="hidden md:flex w-64 flex-col glass-panel rounded-lg mr-4">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold text-foreground">Notes</h2>
                    <button className="p-2 hover:bg-accent/10 rounded-full">
                      <Plus className="w-5 h-5 text-primary" />
                    </button>
                  </div>

                  {/* Folder Structure */}
                  <div className="space-y-4">
                    <button className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/10">
                      <div className="flex items-center space-x-3">
                        <Folder className="w-5 h-5 text-muted-foreground" />
                        <span className="text-foreground">All Notes</span>
                      </div>
                      <span className="text-sm text-muted-foreground">16</span>
                    </button>

                    {/* Personal Folder Group */}
                    <div>
                      <button 
                        className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/10"
                        onClick={() => toggleFolder('personal')}
                      >
                        <div className="flex items-center space-x-3">
                          <Folder className="w-5 h-5 text-primary" />
                          <span className="text-foreground">Personal</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transform transition-transform ${
                          expandedFolders.includes('personal') ? 'rotate-90' : ''
                        }`} />
                      </button>

                      {expandedFolders.includes('personal') && (
                        <div className="ml-4 mt-2 space-y-2">
                          {folders.personal.map(folder => (
                            <button 
                              key={folder.id}
                              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/10"
                            >
                              <div className="flex items-center space-x-3">
                                <File className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">{folder.label}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{folder.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 flex flex-col glass-panel rounded-lg">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-4 border-b border-border">
                  <h1 className="text-xl font-semibold text-foreground">All Notes</h1>
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
                    <button className="p-2 hover:bg-accent/10 rounded-full">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </header>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {/* Time Section */}
                    <div>
                      <h2 className="text-sm font-medium text-muted-foreground mb-3">Today</h2>
                      
                      {/* Note Item */}
                      <div className="glass-panel rounded-lg p-4 hover:bg-accent/10 cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-foreground">{note.title}</h3>
                          <span className="text-sm text-muted-foreground">{note.timestamp}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-muted-foreground">{note.folder}</span>
                          <span className="text-xs text-muted-foreground">{note.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
