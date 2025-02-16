
import React, { useState } from 'react'
import { 
  Settings, 
  ChevronRight,
  Star,
  Clock,
  Flag,
  Tag,
  Users,
  MessageSquare,
  Bookmark,
  ChevronLeft
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import { TagsInput } from '@/components/TagsInput'
import { toast } from 'sonner'

const Saved = () => {
  const navigate = useNavigate()
  const [expandedLists, setExpandedLists] = useState(['smart'])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const queryClient = useQueryClient()

  // Fetch saved items with their tags
  const { data: savedItems, isLoading } = useQuery({
    queryKey: ['saved-items', selectedTags],
    queryFn: async () => {
      let query = supabase
        .from('saved_items')
        .select(`
          *,
          saved_items_tags!inner(
            tags!inner(
              name
            )
          )
        `)

      if (selectedTags.length > 0) {
        query = query.in('saved_items_tags.tags.name', selectedTags)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data
    }
  })

  // Add tag to item mutation
  const addTagToItem = useMutation({
    mutationFn: async ({ itemId, tagName }: { itemId: string, tagName: string }) => {
      // First get or create the tag
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single()

      if (tagError) throw tagError

      // Then create the relation
      const { error } = await supabase
        .from('saved_items_tags')
        .insert([{ saved_item_id: itemId, tag_id: tag.id }])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-items'] })
      toast.success('Tag added successfully')
    },
    onError: (error) => {
      toast.error('Failed to add tag')
      console.error('Error adding tag:', error)
    }
  })

  // Remove tag from item mutation
  const removeTagFromItem = useMutation({
    mutationFn: async ({ itemId, tagName }: { itemId: string, tagName: string }) => {
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single()

      if (tagError) throw tagError

      const { error } = await supabase
        .from('saved_items_tags')
        .delete()
        .match({ saved_item_id: itemId, tag_id: tag.id })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-items'] })
      toast.success('Tag removed successfully')
    },
    onError: (error) => {
      toast.error('Failed to remove tag')
      console.error('Error removing tag:', error)
    }
  })

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName])
    }
  }

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagName))
  }

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
            <h2 className="font-semibold text-black">Saved</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-black mb-2">Filter by Tags</h3>
            <TagsInput
              selectedTags={selectedTags}
              onTagSelect={handleTagSelect}
              onTagRemove={handleTagRemove}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 bg-white border-b">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-black">My Messages</h1>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </header>

        {/* Tag Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="text-center py-4 text-black">Loading...</div>
          ) : (
            <>
              {/* Smart Views Section */}
              <div>
                <button 
                  className="flex items-center justify-between w-full mb-2"
                  onClick={() => toggleSection('smart')}
                >
                  <h2 className="text-lg font-medium text-black">Smart Views</h2>
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
                          <span className="text-black">{item.label}</span>
                        </div>
                        <span className="text-sm text-black">| {item.count}</span>
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
                  <h2 className="text-lg font-medium text-black">Personal Tags</h2>
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
                          <span className="text-black">{item.label}</span>
                        </div>
                        <span className="text-sm text-black">| {item.count}</span>
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
                  <h2 className="text-lg font-medium text-black">From Sender</h2>
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
                          <span className="text-black">{item.label}</span>
                        </div>
                        <span className="text-sm text-black">| {item.count}</span>
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
