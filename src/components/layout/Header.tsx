
import { Bell, Search, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { SidebarTrigger } from '../ui/sidebar';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <SidebarTrigger />
          )}
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
