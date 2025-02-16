
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate('/auth');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="bg-background border-b border-border text-foreground p-4 fixed top-0 w-full z-10">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost"
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
