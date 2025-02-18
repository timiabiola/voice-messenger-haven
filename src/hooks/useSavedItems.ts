
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { SavedItem } from '@/types/saved'
import { useEffect, useState } from 'react'

export const useSavedItems = (selectedTags: string[] = [], page = 1) => {
  const { toast } = useToast()
  const [items, setItems] = useState<SavedItem[]>([])
  const itemsPerPage = 50

  const { data: savedItems, isLoading } = useQuery({
    queryKey: ['saved-items', { selectedTags, page }],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) throw new Error('No user session')

      let query = supabase
        .from('saved_items')
        .select(`
          *,
          sender:profiles(first_name, last_name, email),
          saved_items_tags(
            tags(name)
          )
        `)
        .eq('user_id', session.session.user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)

      if (selectedTags.length > 0) {
        query = query.in('tag', selectedTags)
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

      return data as SavedItem[]
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
          if (savedItems) {
            // Update items based on the change type
            switch (payload.eventType) {
              case 'INSERT':
                setItems([payload.new as SavedItem, ...savedItems])
                break
              case 'UPDATE':
                setItems(savedItems.map(item => 
                  item.id === payload.new.id ? { ...item, ...payload.new } : item
                ))
                break
              case 'DELETE':
                setItems(savedItems.filter(item => item.id !== payload.old.id))
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
    savedItems: items.length > 0 ? items : savedItems,
    isLoading,
    page,
    hasMore: savedItems?.length === itemsPerPage
  }
}
