
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, LogOut, Settings } from 'lucide-react';
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
    <header className="sticky top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-primary hover:text-primary/90"
          >
            <LogOut className="w-5 h-5" />
            <span className="sr-only sm:not-sr-only ml-2">Logout</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/settings')}
              className="text-primary hover:text-primary/90"
            >
              <Settings className="w-5 h-5" />
              <span className="sr-only sm:not-sr-only ml-2">Settings</span>
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
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4">
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
    </header>
  );
};
