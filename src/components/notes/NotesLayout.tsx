import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotesLayoutProps {
  sidebar: ReactNode;
  list: ReactNode;
  editor: ReactNode;
  showEditor: boolean;
  onCloseEditor?: () => void;
}

export const NotesLayout = ({
  sidebar,
  list,
  editor,
  showEditor,
  onCloseEditor,
}: NotesLayoutProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mobile layout - show one panel at a time
  if (isMobile) {
    if (showEditor && editor) {
      return (
        <div className="h-[calc(100vh-8rem)] glass-panel rounded-lg overflow-hidden">
          {editor}
        </div>
      );
    }
    
    return (
      <div className="h-[calc(100vh-8rem)] glass-panel rounded-lg overflow-hidden">
        {list}
      </div>
    );
  }

  // Desktop layout - show multiple panels
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar Panel - Always visible on desktop */}
      <aside className="w-64 flex-shrink-0 glass-panel rounded-lg flex flex-col overflow-hidden">
        {sidebar}
      </aside>

      {/* Notes List Panel - Responsive width based on editor state */}
      <div className={cn(
        "glass-panel rounded-lg transition-all duration-300 overflow-hidden flex-col",
        showEditor 
          ? "w-80 flex-shrink-0 flex" // Always show on desktop
          : "flex-1 flex"
      )}>
        {list}
      </div>

      {/* Editor/Viewer Panel - Takes remaining space */}
      {showEditor && editor && (
        <div className="flex-1 glass-panel rounded-lg animate-in slide-in-from-right overflow-hidden flex flex-col min-w-0">
          {editor}
        </div>
      )}
    </div>
  );
}; 