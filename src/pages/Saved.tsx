
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
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    )
  }

  if (!savedItems?.length && currentPage === 1) {
    return (
      <div className="flex h-screen bg-black">
        <main className="flex-1 flex flex-col w-full">
          <header className="h-16 flex items-center justify-between px-6 border-b border-amber-400/20">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-amber-400/10 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-amber-400" />
              </Button>
              <h1 className="text-xl font-semibold text-amber-400">Saved Messages</h1>
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
    <div className="flex h-screen bg-black">
      <main className="flex-1 flex flex-col w-full">
        <header className="h-16 flex items-center justify-between px-6 border-b border-amber-400/20">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-amber-400/10 rounded-full"
            >
              <ChevronLeft className="w-6 h-6 text-amber-400" />
            </Button>
            <h1 className="text-xl font-semibold text-amber-400">Saved Messages</h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedMessages.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setSelectedMessages([])}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </Button>
            )}
            
            {isEditingTags ? (
              <Button 
                variant="default"
                onClick={saveTagChanges}
                className="bg-amber-400 hover:bg-amber-300 text-black"
              >
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={startEditingTags}
                className="border-amber-400/20 text-amber-400 hover:bg-amber-400/10"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Tags
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {savedItems?.map((message) => (
              <div
                key={message.id}
                className={`glass-panel rounded-lg p-4 transition-all ${
                  selectedMessages.includes(message.id) ? 'bg-amber-400/10' : ''
                }`}
              >
                <div className="flex justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(message.id)}
                      onChange={() => toggleMessageSelect(message.id)}
                      className="mt-1 rounded border-amber-400/20 text-amber-400 focus:ring-amber-400"
                    />
                    <div>
                      <h2 className="font-bold text-xl mb-2 text-amber-400">
                        {message.id}
                      </h2>
                      <p className="text-amber-400/60">Message content here</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.saved_items_tags?.map(({ tags }) => (
                    <span 
                      key={tags.name} 
                      className="bg-amber-400/10 text-amber-400 rounded-full px-3 py-1 text-sm"
                    >
                      {isEditingTags ? (
                        <span className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedTags.find((t) => t === tags.name) || ''}
                            onChange={(e) => editTag(tags.name, e.target.value)}
                            className="bg-transparent border-none focus:outline-none w-20 text-amber-400"
                          />
                          <button 
                            onClick={() => deleteTag(tags.name)}
                            className="text-amber-400/60 hover:text-amber-400"
                          >
                            <Trash2 className="w-4 h-4" />
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
                className="w-full max-w-xs border-amber-400/20 text-amber-400 hover:bg-amber-400/10"
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
