
import { LogOut, Shield } from 'lucide-react';
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
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="w-full py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <button 
          onClick={handleLogout}
          className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
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
  );
};
