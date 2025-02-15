
import { Link } from 'react-router-dom';
import { 
  Home,
  Search,
  PlusCircle,
  Bookmark,
  Mic
} from 'lucide-react';

export const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-4">
      <Link to="/" className="text-gray-600 hover:text-blue-600">
        <Home className="w-6 h-6" />
      </Link>
      <Link to="/search" className="text-gray-600 hover:text-blue-600">
        <Search className="w-6 h-6" />
      </Link>
      <Link to="/microphone" className="text-gray-600 hover:text-blue-600">
        <Mic className="w-6 h-6" />
      </Link>
      <Link to="/new" className="text-gray-600 hover:text-blue-600">
        <PlusCircle className="w-6 h-6" />
      </Link>
      <Link to="/bookmarks" className="text-gray-600 hover:text-blue-600">
        <Bookmark className="w-6 h-6" />
      </Link>
    </div>
  );
};

export default BottomNav;
