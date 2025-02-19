
import { Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TopBarProps {
  isAdmin: boolean;
}

export const TopBar = ({ isAdmin }: TopBarProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="w-full py-4 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="w-full max-w-4xl px-4 mx-auto">
        <div className="flex justify-between items-center">
          <button 
            onClick={handleLogout}
            className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-amber-400 text-black rounded-full text-sm font-medium flex items-center gap-2 hover:bg-amber-300 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
