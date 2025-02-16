
import { Folder, File, ChevronRight, Plus } from 'lucide-react';

type FolderItem = {
  id: string;
  label: string;
  count: number;
}

type FolderStructure = {
  [key: string]: FolderItem[];
}

type FolderSidebarProps = {
  folders: FolderStructure;
  expandedFolders: string[];
  toggleFolder: (folder: string) => void;
}

const FolderSidebar = ({ folders, expandedFolders, toggleFolder }: FolderSidebarProps) => {
  return (
    <aside className="hidden md:flex w-64 flex-col glass-panel rounded-lg mr-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-foreground">Notes</h2>
          <button className="p-2 hover:bg-accent/10 rounded-full">
            <Plus className="w-5 h-5 text-primary" />
          </button>
        </div>

        <div className="space-y-4">
          <button className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent/10">
            <div className="flex items-center space-x-3">
              <Folder className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">All Notes</span>
            </div>
            <span className="text-sm text-muted-foreground">16</span>
          </button>

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
  );
};

export default FolderSidebar;
