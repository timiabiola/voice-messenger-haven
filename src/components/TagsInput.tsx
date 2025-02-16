
import React, { useState, useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface TagsInputProps {
  selectedTags: string[]
  onTagSelect: (tagName: string) => void
  onTagRemove: (tagName: string) => void
}

export const TagsInput = ({ selectedTags, onTagSelect, onTagRemove }: TagsInputProps) => {
  const [input, setInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Fetch existing tags
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) throw new Error('No user session')

      const { data, error } = await supabase
        .from('tags')
        .select('id, name')
        .eq('user_id', session.session.user.id)
      
      if (error) throw error
      return data
    }
  })

  // Create new tag mutation
  const createTag = useMutation({
    mutationFn: async (name: string) => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) throw new Error('No user session')

      const { data, error } = await supabase
        .from('tags')
        .insert([{ 
          name,
          user_id: session.session.user.id
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      onTagSelect(data.name)
      setInput('')
      setIsCreating(false)
      toast.success('Tag created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create tag')
      console.error('Error creating tag:', error)
    }
  })

  // Filter suggestions based on input
  const suggestions = tags
    ?.filter(tag => 
      tag.name.toLowerCase().includes(input.toLowerCase()) && 
      !selectedTags.includes(tag.name)
    )
    .slice(0, 5) || []

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      if (suggestions.length > 0) {
        onTagSelect(suggestions[0].name)
        setInput('')
      } else if (!tags?.some(t => t.name.toLowerCase() === input.toLowerCase())) {
        createTag.mutate(input.trim())
      }
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 bg-white border rounded-lg min-h-[42px]">
        {selectedTags.map(tag => (
          <Badge 
            key={tag} 
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag}
            <button
              onClick={() => onTagRemove(tag)}
              className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border-0 min-w-[120px] focus-visible:ring-0 p-0 h-6"
          placeholder="Add tags..."
        />
      </div>

      {/* Suggestions dropdown */}
      {input && (suggestions.length > 0 || !tags?.some(t => t.name.toLowerCase() === input.toLowerCase())) && (
        <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-10">
          {suggestions.map(tag => (
            <button
              key={tag.id}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
              onClick={() => {
                onTagSelect(tag.name)
                setInput('')
              }}
            >
              {tag.name}
            </button>
          ))}
          {!tags?.some(t => t.name.toLowerCase() === input.toLowerCase()) && (
            <button
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-blue-600"
              onClick={() => createTag.mutate(input.trim())}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create "{input}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}
