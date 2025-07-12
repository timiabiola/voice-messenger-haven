
import { Search, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { SidebarTrigger } from '../ui/sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../ui/input';

interface HeaderProps {
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

const Header = ({ onSearch, showSearch }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 flex-1">
          {showBackButton ? (
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-300"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </Button>
          ) : (
            <SidebarTrigger />
          )}
          {showSearch && (
            <div className="flex-1 max-w-xl relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search messages..."
                className="pl-9 bg-background/50"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
