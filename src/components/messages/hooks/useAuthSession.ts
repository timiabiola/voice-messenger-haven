
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSession = () => {
  const navigate = useNavigate();

  const validateAndRefreshSession = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast.error('Session expired. Please sign in again.');
      navigate('/auth');
      return null;
    }

    if (!session) {
      console.log('No active session found');
      navigate('/auth', { 
        state: { 
          returnTo: window.location.pathname,
          message: 'Please sign in to play audio messages'
        } 
      });
      return null;
    }

    // Try to validate session first
    const { error: validationError } = await supabase.auth.getUser();
    if (validationError) {
      console.error('Session validation error:', validationError);
      
      try {
        // Try to refresh the session
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          if (refreshError.message.includes('refresh_token_not_found')) {
            console.error('Invalid refresh token, redirecting to auth');
            toast.error('Your session has expired. Please sign in again.');
            navigate('/auth');
            return null;
          }
          throw refreshError;
        }
      } catch (refreshError) {
        console.error('Session refresh failed:', refreshError);
        toast.error('Please sign in again to continue');
        navigate('/auth');
        return null;
      }
    }

    // Get fresh session after potential refresh
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    if (!freshSession) {
      throw new Error('No session after refresh');
    }

    return freshSession;
  };

  return { validateAndRefreshSession };
};
