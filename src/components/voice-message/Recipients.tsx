
import { X, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { formatNameWithInitial } from '@/lib/utils';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface RecipientsProps {
  recipients: Profile[];
  onAddRecipient: (profile: Profile) => void;
  onRemoveRecipient: (profileId: string) => void;
  isProcessing: boolean;
}

export const Recipients = ({ 
  recipients, 
  onAddRecipient, 
  onRemoveRecipient, 
  isProcessing 
}: RecipientsProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Get current user's ID on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          toast.error('Authentication error. Please sign in again.');
          navigate('/auth');
          return;
        }

        if (!session) {
          console.log('No active session found');
          navigate('/auth');
          return;
        }

        setCurrentUser(session.user.id);
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!session) {
            navigate('/auth');
          } else {
            setCurrentUser(session.user.id);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth status:', error);
        toast.error('Error checking authentication status');
        navigate('/auth');
      }
    };

    getCurrentUser();
  }, [navigate]);

  const searchUsers = async (query: string) => {
    if (!query || !currentUser) {
      setSearchResults([]);
      return;
    }

    try {
      // Extract IDs of already selected recipients
      const recipientIds = recipients.map(r => r.id);
      
      let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', currentUser);
      
      // Exclude already selected recipients if any
      if (recipientIds.length > 0) {
        queryBuilder = queryBuilder.not('id', 'in', `(${recipientIds.join(',')})`);
      }
      
      const { data, error } = await queryBuilder.limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUser, recipients]);

  const handleAddRecipient = (profile: Profile) => {
    if (!currentUser) {
      toast.error('Please sign in to add recipients');
      navigate('/auth');
      return;
    }

    // Double-check that user isn't adding themselves
    if (profile.id === currentUser) {
      toast.error("You cannot send a message to yourself");
      return;
    }
    
    // Check if recipient is already added
    if (recipients.some(r => r.id === profile.id)) {
      toast.error("This recipient has already been added");
      return;
    }

    onAddRecipient(profile);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="space-y-2 w-full relative">
      <label className="text-sm text-muted-foreground px-1 text-center block">To:</label>
      <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-background rounded-lg border focus-within:border-primary min-h-[44px]">
        {recipients.map((recipient) => (
          <div 
            key={recipient.id}
            className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full"
          >
            <span className="text-sm truncate max-w-[150px]">
              {formatNameWithInitial(recipient.first_name, recipient.last_name)}
            </span>
            <button
              onClick={() => onRemoveRecipient(recipient.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <input 
          type="text"
          placeholder="Search users..."
          className="flex-1 bg-transparent outline-none min-w-[120px] h-[32px] text-center"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          disabled={isProcessing}
        />
      </div>
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full bg-popover border rounded-lg shadow-lg mt-1 overflow-hidden">
          {searchResults.map((profile) => (
            <button
              key={profile.id}
              className="w-full px-3 py-2 text-left hover:bg-accent/50 flex items-center gap-2 transition-colors"
              onClick={() => handleAddRecipient(profile)}
              disabled={isProcessing}
            >
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {formatNameWithInitial(profile.first_name, profile.last_name)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
