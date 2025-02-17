
import { ChevronLeft, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const isIndexPage = location.pathname === '/';

  return (
    <header className="bg-background border-b border-border text-foreground p-4 fixed top-0 w-full z-10">
      <div className="flex justify-between items-center">
        {isIndexPage ? (
          <Button 
            variant="ghost"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        ) : (
          <Button 
            variant="ghost"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleBack}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
