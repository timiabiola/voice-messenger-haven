
import React, { useState } from 'react'
import { 
  Settings, 
  ChevronRight,
  Star,
  Clock,
  Flag,
  Tag,
  User,
  Users,
  MessageSquare,
  Bookmark
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

const Saved = () => {
  const [expandedLists, setExpandedLists] = useState(['smart'])

  // Fetch saved items
  const { data: savedItems, isLoading } = useQuery({
    queryKey: ['saved-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
      
      if (error) throw error
      return data
    }
  })

  // Process saved items into sections
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Only visible on desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <Bookmark className="w-8 h-8 text-blue-600" />
            <h2 className="font-semibold">Saved</h2>
          </div>
          
          <nav className="space-y-1">
            {['Smart Views', 'Personal Tags', 'From Sender'].map((category, i) => (
              <button key={i} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50">
                <span className="text-gray-700">{category}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 bg-white border-b">
          <h1 className="text-xl font-semibold">My Messages</h1>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        {/* Tag Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <>
              {/* Smart Views Section */}
              <div>
                <button 
                  className="flex items-center justify-between w-full mb-2"
                  onClick={() => toggleSection('smart')}
                >
                  <h2 className="text-lg font-medium text-gray-900">Smart Views</h2>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transform transition-transform ${
                    expandedLists.includes('smart') ? 'rotate-90' : ''
                  }`} />
                </button>
                
                {expandedLists.includes('smart') && (
                  <div className="space-y-2">
                    {sections.smart.map(item => (
                      <button 
                        key={item.id}
                        className="flex items-center justify-between w-full p-3 rounded-lg bg-white hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-blue-600">
                            {item.icon}
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <span className="text-sm text-gray-500">| {item.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Tags Section */}
              <div>
                <button 
                  className="flex items-center justify-between w-full mb-2"
                  onClick={() => toggleSection('personal')}
                >
                  <h2 className="text-lg font-medium text-gray-900">Personal Tags</h2>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transform transition-transform ${
                    expandedLists.includes('personal') ? 'rotate-90' : ''
                  }`} />
                </button>
                
                {expandedLists.includes('personal') && (
                  <div className="space-y-2">
                    {sections.personal.map(item => (
                      <button 
                        key={item.id}
                        className="flex items-center justify-between w-full p-3 rounded-lg bg-white hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-blue-600">
                            {item.icon}
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <span className="text-sm text-gray-500">| {item.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* From Sender Section */}
              <div>
                <button 
                  className="flex items-center justify-between w-full mb-2"
                  onClick={() => toggleSection('sender')}
                >
                  <h2 className="text-lg font-medium text-gray-900">From Sender</h2>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transform transition-transform ${
                    expandedLists.includes('sender') ? 'rotate-90' : ''
                  }`} />
                </button>
                
                {expandedLists.includes('sender') && (
                  <div className="space-y-2">
                    {sections.sender.map(item => (
                      <button 
                        key={item.id}
                        className="flex items-center justify-between w-full p-3 rounded-lg bg-white hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-blue-600">
                            {item.icon}
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <span className="text-sm text-gray-500">| {item.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default Saved;
