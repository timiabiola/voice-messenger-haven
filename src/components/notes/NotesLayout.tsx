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
    if (showEditor) {
      return (
        <div className="h-[calc(100vh-8rem)] glass-panel rounded-lg">
          {editor}
        </div>
      );
    }
    
    return (
      <div className="h-[calc(100vh-8rem)] glass-panel rounded-lg">
        {list}
      </div>
    );
  }

  // Desktop layout - show multiple panels
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar Panel */}
      <aside className="w-64 flex-col glass-panel rounded-lg hidden md:flex">
        {sidebar}
      </aside>

      {/* Notes List Panel */}
      <div className={cn(
        "glass-panel rounded-lg transition-all duration-300",
        showEditor ? "w-96 flex-shrink-0 hidden lg:block" : "flex-1"
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