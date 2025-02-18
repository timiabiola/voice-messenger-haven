
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HomeHeaderProps {
  unreadCount: number;
  isAdmin: boolean;
}

export const HomeHeader = ({ unreadCount, isAdmin }: HomeHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="sticky top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex justify-between items-center p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-primary hover:text-primary/90"
        >
          <LogOut className="w-5 h-5" />
          <span className="sr-only sm:not-sr-only ml-2">Logout</span>
        </Button>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={() => navigate('/inbox-0')}
            className="text-primary hover:text-primary/90 flex items-center gap-2"
          >
            <Badge variant="destructive" className="animate-pulse">
              {unreadCount} new
            </Badge>
            <span className="sr-only sm:not-sr-only">Messages</span>
          </Button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
        <h1 className="text-2xl font-bold text-primary">Welcome to the App</h1>
        {isAdmin && (
          <Button
            onClick={() => navigate('/admin')}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};
