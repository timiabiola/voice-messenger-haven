
import React, { useState } from 'react'
import { 
  Settings, 
  ChevronLeft,
  Check,
  Edit2,
  Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSavedItems } from '@/hooks/useSavedItems'
import EmptyState from '@/components/layout/EmptyState'
import { Button } from '@/components/ui/button'

const Saved = () => {
  const navigate = useNavigate()
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const { savedItems, isLoading, hasMore } = useSavedItems(selectedTags, currentPage)

  const toggleMessageSelect = (messageId: string) => {
    setSelectedMessages(
      selectedMessages.includes(messageId)
        ? selectedMessages.filter((id) => id !== messageId)
        : [...selectedMessages, messageId]
    )
  }

  const startEditingTags = () => {
    const uniqueTags = [...new Set(savedItems?.flatMap(item => 
      item.saved_items_tags?.map(t => t.tags.name) || []
    ))]
    setEditedTags(uniqueTags)
    setIsEditingTags(true)
  }

  const editTag = (oldTag: string, newTag: string) => {
    setEditedTags(editedTags.map((tag) => (tag === oldTag ? newTag : tag)))
  }

  const deleteTag = (tagToDelete: string) => {
    setEditedTags(editedTags.filter((tag) => tag !== tagToDelete))
  }

  const saveTagChanges = () => {
    setIsEditingTags(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  if (!savedItems?.length && currentPage === 1) {
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
          <div className="flex-1">
            <EmptyState />
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
          <div className="flex items-center gap-2">
            {selectedMessages.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setSelectedMessages([])}
                className="gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only">Delete</span>
              </Button>
            )}
            
            {isEditingTags ? (
              <Button 
                variant="default"
                size="sm"
                onClick={saveTagChanges}
                className="bg-amber-400 hover:bg-amber-300 text-black"
              >
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={startEditingTags}
                className="border-amber-400/20 text-amber-400 hover:bg-amber-400/10"
              >
                <Edit2 className="w-4 h-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Edit Tags</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-amber-400/10 rounded-full"
            >
              <Settings className="w-6 h-6 text-amber-400" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {savedItems?.map((message) => (
              <div
                key={message.id}
                className={`glass-panel rounded-lg p-4 transition-all active:scale-[0.98] touch-manipulation ${
                  selectedMessages.includes(message.id) ? 'bg-amber-400/10' : ''
                }`}
              >
                <div className="flex justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(message.id)}
                      onChange={() => toggleMessageSelect(message.id)}
                      className="mt-1 w-5 h-5 rounded border-amber-400/20 text-amber-400 focus:ring-amber-400"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-base text-amber-400 mb-1 truncate">
                        {message.id}
                      </h2>
                      <p className="text-sm text-amber-400/60 line-clamp-2">Message content here</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.saved_items_tags?.map(({ tags }) => (
                    <span 
                      key={tags.name} 
                      className="bg-amber-400/10 text-amber-400 rounded-full px-2.5 py-0.5 text-xs"
                    >
                      {isEditingTags ? (
                        <span className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editedTags.find((t) => t === tags.name) || ''}
                            onChange={(e) => editTag(tags.name, e.target.value)}
                            className="bg-transparent border-none focus:outline-none w-16 text-amber-400 text-xs px-0"
                          />
                          <button 
                            onClick={() => deleteTag(tags.name)}
                            className="text-amber-400/60 hover:text-amber-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ) : (
                        tags.name
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                className="w-full border-amber-400/20 text-amber-400 hover:bg-amber-400/10"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Saved
