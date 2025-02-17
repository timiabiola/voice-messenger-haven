
import React from 'react'
import { ChevronRight } from 'lucide-react'
import { SavedSectionItem } from '@/types/saved'

type SavedSectionProps = {
  title: string
  items: SavedSectionItem[]
  isExpanded: boolean
  onToggle: () => void
}

const SavedSection = ({
  title,
  items,
  isExpanded,
  onToggle
}: SavedSectionProps) => {
  return (
    <div>
      <button 
        className="flex items-center justify-between w-full mb-2"
        onClick={onToggle}
      >
        <h2 className="text-lg font-medium text-black">{title}</h2>
        <ChevronRight className={`w-5 h-5 text-gray-400 transform transition-transform ${
          isExpanded ? 'rotate-90' : ''
        }`} />
      </button>
      
      {isExpanded && (
        <div className="space-y-2">
          {items.map(item => (
            <button 
              key={item.id}
              className="flex items-center justify-between w-full p-3 rounded-lg bg-white hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="text-blue-600">
                  {item.icon}
                </div>
                <span className="text-black">{item.label}</span>
              </div>
              <span className="text-sm text-black">| {item.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedSection
