import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NotesLayoutProps {
  sidebar: ReactNode;
  list: ReactNode;
  editor: ReactNode;
  showEditor: boolean;
}

export const NotesLayout = ({
  sidebar,
  list,
  editor,
  showEditor,
}: NotesLayoutProps) => {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar Panel */}
      <aside className="hidden md:flex w-64 flex-col glass-panel rounded-lg">
        {sidebar}
      </aside>

      {/* Notes List Panel */}
      <div className={cn(
        "flex-1 glass-panel rounded-lg transition-all duration-300",
        showEditor ? "hidden lg:block lg:max-w-md" : ""
      )}>
        {list}
      </div>

      {/* Editor/Viewer Panel */}
      {showEditor && (
        <div className="flex-1 glass-panel rounded-lg animate-in slide-in-from-right">
          {editor}
        </div>
      )}
    </div>
  );
}; 