
import React, { useState } from 'react'
import { 
  Settings, 
  ChevronLeft,
  Star,
  Clock,
  Flag,
  Tag,
  Users,
  MessageSquare,
  Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSavedItems } from '@/hooks/useSavedItems'
import SavedSidebar from '@/components/saved/SavedSidebar'
import SavedSection from '@/components/saved/SavedSection'
import { SavedSectionItem } from '@/types/saved'
import EmptyState from '@/components/layout/EmptyState'
import { Button } from '@/components/ui/button'

const Saved = () => {
  const navigate = useNavigate()
  const [expandedLists, setExpandedLists] = useState(['smart'])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const { savedItems, isLoading, hasMore } = useSavedItems(selectedTags, currentPage)

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName])
      setCurrentPage(1) // Reset to first page when filter changes
    }
  }

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagName))
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const sections = {
    smart: [
      { 
        id: 'unread', 
        label: 'Unread', 
        count: savedItems?.filter(item => !item.is_read).length || 0, 
        icon: <MessageSquare /> 
      },
      { 
        id: 'flagged', 
        label: 'Flagged', 
        count: savedItems?.filter(item => item.is_flagged).length || 0, 
        icon: <Flag /> 
      },
      { 
        id: 'recent', 
        label: 'Recent', 
        count: savedItems?.length || 0, 
        icon: <Clock /> 
      }
    ],
    personal: [
      { 
        id: 'important', 
        label: 'Important', 
        count: savedItems?.filter(item => item.tag === 'important').length || 0, 
        icon: <Star /> 
      },
      { 
        id: 'work', 
        label: 'Work', 
        count: savedItems?.filter(item => item.tag === 'work').length || 0, 
        icon: <Tag /> 
      }
    ],
    sender: [
      { 
        id: 'team', 
        label: 'Team', 
        count: savedItems?.filter(item => item.category === 'team').length || 0, 
        icon: <Users /> 
      }
    ]
  }

  const toggleSection = (section: string) => {
    if (expandedLists.includes(section)) {
      setExpandedLists(expandedLists.filter(s => s !== section))
    } else {
      setExpandedLists([...expandedLists, section])
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SavedSidebar
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          onTagRemove={handleTagRemove}
        />
        <main className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  if (!savedItems?.length && currentPage === 1) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SavedSidebar
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          onTagRemove={handleTagRemove}
        />
        <main className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-4 bg-white border-b">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </Button>
              <h1 className="text-xl font-semibold text-black">My Messages</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-gray-100 rounded-full"
            >
              <Settings className="w-6 h-6 text-gray-600" />
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
    <div className="flex h-screen bg-gray-50">
      <SavedSidebar
        selectedTags={selectedTags}
        onTagSelect={handleTagSelect}
        onTagRemove={handleTagRemove}
      />

      <main className="flex-1 flex flex-col">
        <header className="h-16 flex items-center justify-between px-4 bg-white border-b">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Button>
            <h1 className="text-xl font-semibold text-black">My Messages</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 rounded-full"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <SavedSection
            title="Smart Views"
            items={sections.smart as SavedSectionItem[]}
            isExpanded={expandedLists.includes('smart')}
            onToggle={() => toggleSection('smart')}
          />

          <SavedSection
            title="Personal Tags"
            items={sections.personal as SavedSectionItem[]}
            isExpanded={expandedLists.includes('personal')}
            onToggle={() => toggleSection('personal')}
          />

          <SavedSection
            title="From Sender"
            items={sections.sender as SavedSectionItem[]}
            isExpanded={expandedLists.includes('sender')}
            onToggle={() => toggleSection('sender')}
          />

          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                className="w-full max-w-xs"
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
