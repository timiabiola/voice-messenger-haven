
import { Folder, File, ChevronRight, Plus } from 'lucide-react';
import { Folder as FolderType, Note } from '@/types/notes';

type FolderSidebarProps = {
  folders: FolderType[];
  notes: Note[];
  activeFolder: string | null;
  expandedFolders: string[];
  onFolderClick: (folderId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  setActiveFolder: (folderId: string | null) => void;
};

export default function FolderSidebar({
  folders,
  notes,
  activeFolder,
  expandedFolders,
  onFolderClick,
  onToggleFolder,
  onCreateFolder,
  setActiveFolder,
}: FolderSidebarProps) {
  const getRootFolders = () => folders.filter(folder => !folder.parent_folder_id);
  const getChildFolders = (parentId: string) => folders.filter(folder => folder.parent_folder_id === parentId);
  const getFolderNoteCount = (folderId: string) => notes.filter(note => note.folder_id === folderId).length;

  return (
    <aside className="hidden md:flex w-64 flex-col glass-panel rounded-lg mr-4 relative">
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-foreground">Notes</h2>
        </div>

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

          {getRootFolders().map(folder => (
            <div key={folder.id}>
              <button 
                className={`flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/10 ${
                  activeFolder === folder.id ? 'bg-accent/10' : ''
                }`}
                onClick={() => onToggleFolder(folder.id)}
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
                      onClick={() => onFolderClick(childFolder.id)}
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
      
      <div className="p-4 border-t border-border">
        <button 
          onClick={onCreateFolder}
          className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground w-full p-2 rounded-lg hover:bg-accent/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Folder</span>
        </button>
      </div>
    </aside>
  );
}
