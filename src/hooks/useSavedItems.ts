
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useSavedItems(selectedTags: string[]) {
  const queryClient = useQueryClient()

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

  const addTagToItem = useMutation({
    mutationFn: async ({ itemId, tagName }: { itemId: string, tagName: string }) => {
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single()

      if (tagError) throw tagError

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

  return {
    savedItems,
    isLoading,
    addTagToItem,
    removeTagFromItem
  }
}
