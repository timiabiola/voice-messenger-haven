
import { Link } from 'react-router-dom';
import { 
  Home,
  Users,
  Mic,
  Bookmark,
  NotepadText
} from 'lucide-react';

export const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-4 z-50">
      <Link to="/" className="nav-item">
        <Home className="w-6 h-6" color="#5271ff" />
      </Link>
      <Link to="/microphone" className="nav-item">
        <Mic className="w-6 h-6" color="#5271ff" />
      </Link>
      <Link to="/contacts" className="nav-item">
        <Users className="w-6 h-6" color="#5271ff" />
      </Link>
      <Link to="/saved" className="nav-item">
        <Bookmark className="w-6 h-6" color="#5271ff" />
      </Link>
      <Link to="/notes" className="nav-item">
        <NotepadText className="w-6 h-6" color="#5271ff" />
      </Link>
    </div>
  );
};

export default BottomNav;
