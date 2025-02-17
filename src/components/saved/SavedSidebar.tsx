
import React from 'react'
import { Bookmark } from 'lucide-react'
import { TagsInput } from '@/components/TagsInput'

type SavedSidebarProps = {
  selectedTags: string[]
  onTagSelect: (tagName: string) => void
  onTagRemove: (tagName: string) => void
}

const SavedSidebar = ({
  selectedTags,
  onTagSelect,
  onTagRemove
}: SavedSidebarProps) => {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6">
          <Bookmark className="w-8 h-8 text-blue-600" />
          <h2 className="font-semibold text-black">Saved</h2>
        </div>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium text-black mb-2">Filter by Tags</h3>
          <TagsInput
            selectedTags={selectedTags}
            onTagSelect={onTagSelect}
            onTagRemove={onTagRemove}
          />
        </div>
        
        <nav className="space-y-1">
          {['Smart Views', 'Personal Tags', 'From Sender'].map((category, i) => (
            <button key={i} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 text-black">
              <span>{category}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default SavedSidebar
