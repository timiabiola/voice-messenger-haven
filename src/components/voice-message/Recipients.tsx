
import { X, UserPlus, Loader2, Search } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { formatNameWithInitial } from '@/lib/utils';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

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
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Get current user's ID on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Auth error:', error.message);
          toast.error('Authentication error. Please sign in again.');
          navigate('/auth');
          return;
        }

        if (!session) {
          logger.log('No active session found');
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
        logger.error('Error checking auth status:', error);
        toast.error('Error checking authentication status');
        navigate('/auth');
      }
    };

    getCurrentUser();
  }, [navigate]);

  const searchUsers = async (query: string) => {
    if (!query || !currentUser) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Extract IDs of already selected recipients
      const recipientIds = recipients.map(r => r.id);
      
      let queryBuilder = supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, email')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .neq('id', currentUser);
      
      // Exclude already selected recipients if any
      if (recipientIds.length > 0) {
        queryBuilder = queryBuilder.not('id', 'in', `(${recipientIds.join(',')})`);
      }
      
      const { data, error } = await queryBuilder.limit(5);

      if (error) throw error;
      setSearchResults(data || []);
      setSelectedIndex(0); // Reset selection when results change
    } catch (error) {
      logger.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
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

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleAddRecipient(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSearchQuery('');
        break;
    }
  }, [showResults, searchResults, selectedIndex]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 w-full relative">
      <label className="text-sm text-muted-foreground px-1 text-center block">To:</label>
      <div className={cn(
        "flex flex-wrap items-center justify-center gap-2 p-2 bg-background rounded-lg border min-h-[44px] transition-colors",
        recipients.length === 0 && searchQuery === '' ? "border-destructive/50" : "focus-within:border-primary"
      )}>
        {recipients.map((recipient) => (
          <div 
            key={recipient.id}
            className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full animate-in fade-in-50 duration-200"
          >
            {recipient.avatar_url && (
              <img 
                src={recipient.avatar_url} 
                alt=""
                className="w-5 h-5 rounded-full object-cover"
              />
            )}
            <span className="text-sm truncate max-w-[150px]">
              {formatNameWithInitial(recipient.first_name, recipient.last_name)}
            </span>
            <button
              onClick={() => onRemoveRecipient(recipient.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              disabled={isProcessing}
              aria-label="Remove recipient"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex-1 min-w-[120px] relative flex items-center">
          {isSearching && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground absolute left-2" />
          )}
          <input 
            ref={searchInputRef}
            type="text"
            placeholder={recipients.length === 0 ? "Type a name to search..." : "Add another recipient..."}
            className={cn(
              "w-full bg-transparent outline-none h-[32px] text-center",
              isSearching && "pl-8"
            )}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery && setShowResults(true)}
            disabled={isProcessing}
            aria-label="Search for recipients"
            aria-expanded={showResults}
            aria-controls="recipient-results"
            role="combobox"
            aria-autocomplete="list"
          />
        </div>
      </div>
      
      {recipients.length === 0 && !searchQuery && (
        <p className="text-xs text-destructive text-center">
          Please select at least one recipient from the dropdown
        </p>
      )}

      {showResults && (
        <div 
          ref={resultsRef}
          id="recipient-results"
          className="absolute z-10 w-full bg-popover border rounded-lg shadow-lg mt-1 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          role="listbox"
        >
          {searchResults.length === 0 && searchQuery && !isSearching ? (
            <div className="px-3 py-4 text-center text-muted-foreground">
              <Search className="w-5 h-5 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No users found matching "{searchQuery}"</p>
              <p className="text-xs mt-1">Try searching by first name or last name</p>
            </div>
          ) : (
            searchResults.map((profile, index) => (
              <button
                key={profile.id}
                className={cn(
                  "w-full px-3 py-2 text-left flex items-center gap-3 transition-colors",
                  index === selectedIndex ? "bg-accent" : "hover:bg-accent/50",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleAddRecipient(profile)}
                disabled={isProcessing}
                role="option"
                aria-selected={index === selectedIndex}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate">
                    {formatNameWithInitial(profile.first_name, profile.last_name)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
