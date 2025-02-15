
import { LayoutGrid, Mic, Users, Bookmark } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutGrid, path: '/', label: 'Home' },
    { icon: Mic, path: '/microphone', label: 'Record' },
    { icon: Users, path: '/contacts', label: 'Contacts' },
    { icon: Bookmark, path: '/bookmarks', label: 'Bookmarks' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 w-full max-w-md bg-white border-t p-4 z-10">
      <div className="grid grid-cols-4 gap-4">
        {navItems.map(({ icon: Icon, path, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center transition-colors ${
              isActive(path) ? 'text-[#2196F3]' : 'text-[#9E9E9E] hover:text-gray-600'
            }`}
            aria-label={label}
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
