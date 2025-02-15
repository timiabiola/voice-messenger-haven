
import { Link } from 'react-router-dom';
import { 
  Home,
  Users,
  Mic,
  Bookmark
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const BottomNav = () => {
  const isMobile = useIsMobile();
  
  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-4 max-w-3xl mx-auto z-50">
      <Link to="/" className="nav-item">
        <Home className="w-6 h-6" />
      </Link>
      <Link to="/microphone" className="nav-item">
        <Mic className="w-6 h-6" />
      </Link>
      <Link to="/contacts" className="nav-item">
        <Users className="w-6 h-6" />
      </Link>
      <Link to="/bookmarks" className="nav-item">
        <Bookmark className="w-6 h-6" />
      </Link>
    </div>
  );
};

export default BottomNav;
