
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  Users,
  Mic,
  Bookmark,
  NotepadText
} from 'lucide-react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';

interface BottomNavProps {
  unreadCount?: number;
}

export const BottomNav = ({ unreadCount = 0 }: BottomNavProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t 
      flex items-center justify-around px-4 z-50">
      <Link to="/" className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl 
        transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Home className="w-6 h-6" />
        <span className="text-xs mt-1">Home</span>
      </Link>
      <Link to="/microphone" className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl 
        transition-colors ${isActive('/microphone') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Mic className="w-6 h-6" />
        <span className="text-xs mt-1">Record</span>
      </Link>
      <Link to="/contacts" className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl 
        transition-colors ${isActive('/contacts') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Users className="w-6 h-6" />
        <span className="text-xs mt-1">Contacts</span>
      </Link>
      <Link to="/saved" className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl 
        transition-colors ${isActive('/saved') ? 'text-primary' : 'text-muted-foreground'}`}>
        <Bookmark className="w-6 h-6" />
        <span className="text-xs mt-1">Saved</span>
      </Link>
      <Link to="/notes" className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl relative
        transition-colors ${isActive('/notes') ? 'text-primary' : 'text-muted-foreground'}`}>
        <NotepadText className="w-6 h-6" />
        <span className="text-xs mt-1">Notes</span>
      </Link>
    </div>
  );
};

export default BottomNav;
