
import { X, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    <div className="space-y-2 max-w-2xl mx-auto relative">
      <label className="text-sm text-gray-600">To:</label>
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg border focus-within:border-blue-500">
        {recipients.map((recipient) => (
          <div 
            key={recipient.id}
            className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded"
          >
            <span className="text-sm">
              {recipient.first_name || recipient.email}
            </span>
            <button
              onClick={() => onRemoveRecipient(recipient.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex-1 min-w-[200px]">
          <input 
            type="text"
            placeholder="Search users..."
            className="w-full outline-none"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            disabled={isProcessing}
          />
        </div>
      </div>
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1">
          {searchResults.map((profile) => (
            <button
              key={profile.id}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              onClick={() => handleAddRecipient(profile)}
            >
              <UserPlus className="w-4 h-4 text-gray-500" />
              <span>
                {profile.first_name} {profile.last_name}
              </span>
              <span className="text-sm text-gray-500">
                ({profile.email})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
