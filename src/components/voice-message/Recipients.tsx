
import { X, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const searchUsers = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

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
  }, [searchQuery]);

  const handleAddRecipient = (profile: Profile) => {
    onAddRecipient(profile);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="space-y-2 w-full relative">
      <label className="text-sm text-muted-foreground px-1">To:</label>
      <div className="flex flex-wrap items-center gap-2 p-2 bg-background rounded-lg border focus-within:border-primary min-h-[44px]">
        {recipients.map((recipient) => (
          <div 
            key={recipient.id}
            className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full"
          >
            <span className="text-sm truncate max-w-[150px]">
              {recipient.first_name || recipient.email}
            </span>
            <button
              onClick={() => onRemoveRecipient(recipient.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <input 
          type="text"
          placeholder="Search users..."
          className="flex-1 bg-transparent outline-none min-w-[120px] h-[32px]"
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
            >
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {profile.first_name} {profile.last_name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {profile.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
