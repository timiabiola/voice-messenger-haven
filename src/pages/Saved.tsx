import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  ChevronLeft,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSavedItems } from '@/hooks/useSavedItems'
import { Button } from '@/components/ui/button'
import { SavedMessageCard } from '@/components/saved/SavedMessageCard'
import { FilterBar } from '@/components/saved/FilterBar'
import { supabase } from '@/integrations/supabase/client'

const Saved = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [voiceMessages, setVoiceMessages] = useState<any[]>([])

  const { savedItems, isLoading, hasMore } = useSavedItems(selectedTags, searchQuery, currentPage)

  // Fetch voice message data for saved items
  useEffect(() => {
    const fetchVoiceMessages = async () => {
      if (!savedItems || savedItems.length === 0) return;

      // Filter for voice message saved items
      const voiceMessageItems = savedItems.filter(item => item.category === 'voice_message');
      const messageIds = voiceMessageItems.map(item => item.content).filter(Boolean);

      if (messageIds.length === 0) {
        setVoiceMessages([]);
        return;
      }

      const { data: messages, error } = await supabase
        .from('voice_messages')
        .select(`
          id,
          subject,
          audio_url,
          created_at,
          sender:profiles!fk_voice_messages_sender(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .in('id', messageIds);

      if (error) {
        console.error('Error fetching voice messages:', error);
        return;
      }

      // Combine saved items with voice message data
      const combinedData = voiceMessageItems.map(savedItem => {
        const message = messages?.find(m => m.id === savedItem.content);
        return {
          id: savedItem.id,
          saved_at: savedItem.created_at,
          voice_message: message || null,
          saved_items_tags: savedItem.saved_items_tags
        };
      }).filter(item => item.voice_message !== null);

      setVoiceMessages(combinedData);
    };

    fetchVoiceMessages();
  }, [savedItems]);

  const handleTagSelect = (tagId: string) => {
    setSelectedTags([...selectedTags, tagId]);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(selectedTags.filter(id => id !== tagId));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  const hasActiveFilters = searchQuery.length > 0 || selectedTags.length > 0;

  if (voiceMessages.length === 0 && currentPage === 1 && !hasActiveFilters) {
    return (
      <div className="flex min-h-[100dvh] bg-black">
        <main className="flex-1 flex flex-col w-full">
          <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 border-b border-amber-400/20 bg-black/80 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-amber-400/10 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-amber-400" />
              </Button>
              <h1 className="text-lg font-semibold text-amber-400">Saved Messages</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-amber-400/10 rounded-full"
            >
              <Settings className="w-6 h-6 text-amber-400" />
            </Button>
          </header>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <p className="text-gray-400">No saved messages yet</p>
              <Button
                onClick={() => navigate('/inbox')}
                className="bg-amber-400 hover:bg-amber-300 text-black"
              >
                Go to Inbox
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] bg-black">
      <main className="flex-1 flex flex-col w-full">
        <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-4 border-b border-amber-400/20 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-amber-400/10 rounded-full"
            >
              <ChevronLeft className="w-6 h-6 text-amber-400" />
            </Button>
            <h1 className="text-lg font-semibold text-amber-400">Saved Messages</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-amber-400/10 rounded-full"
          >
            <Settings className="w-6 h-6 text-amber-400" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Filter Bar */}
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            onTagRemove={handleTagRemove}
            onClearFilters={handleClearFilters}
          />

          {/* Messages List */}
          {voiceMessages.length === 0 && hasActiveFilters ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No messages found matching your filters</p>
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="mt-4 text-amber-400 hover:text-amber-300"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {voiceMessages.map((savedItem) => (
                <SavedMessageCard key={savedItem.id} savedItem={savedItem} />
              ))}
            </div>
          )}

          {hasMore && voiceMessages.length > 0 && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                className="w-full border-amber-400/20 text-amber-400 hover:bg-amber-400/10"
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Saved
