import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { SavedItem } from '@/types/saved'
import { useEffect, useState } from 'react'

export const useSavedItems = (selectedTags: string[] = [], searchQuery: string = '', page = 1) => {
  const { toast } = useToast()
  const [items, setItems] = useState<SavedItem[]>([])
  const itemsPerPage = 50

  const { data: savedItems, isLoading } = useQuery({
    queryKey: ['saved-items', { selectedTags, searchQuery, page }],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) throw new Error('No user session')

      let query = supabase
        .from('saved_items')
        .select(`
          *,
          sender:profiles!fk_saved_items_sender(first_name, last_name, email),
          saved_items_tags(
            tag_id,
            tags(id, name)
          )
        `)
        .eq('user_id', session.session.user.id)
        .eq('category', 'voice_message')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching saved items:', error)
        toast({
          variant: "destructive",
          title: "Error fetching saved items",
          description: error.message
        })
        throw error
      }

      let filteredData = data || []

      // Apply tag filter on the client side
      if (selectedTags.length > 0) {
        filteredData = filteredData.filter(item => {
          const itemTagIds = item.saved_items_tags?.map(t => t.tag_id) || []
          return selectedTags.some(tagId => itemTagIds.includes(tagId))
        })
      }

      // Apply pagination
      const startIndex = (page - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedData = filteredData.slice(startIndex, endIndex)

      return {
        items: paginatedData as SavedItem[],
        totalCount: filteredData.length,
        hasMore: filteredData.length > endIndex
      }
    }
  })

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('saved-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_items'
        },
        (payload) => {
          if (savedItems?.items) {
            // Update items based on the change type
            switch (payload.eventType) {
              case 'INSERT':
                setItems([payload.new as SavedItem, ...savedItems.items])
                break
              case 'UPDATE':
                setItems(savedItems.items.map(item => 
                  item.id === payload.new.id ? { ...item, ...payload.new } : item
                ))
                break
              case 'DELETE':
                setItems(savedItems.items.filter(item => item.id !== payload.old.id))
                break
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [savedItems])

  return {
    savedItems: items.length > 0 ? items : savedItems?.items,
    isLoading,
    page,
    hasMore: savedItems?.hasMore || false,
    totalCount: savedItems?.totalCount || 0
  }
}
