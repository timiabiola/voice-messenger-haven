
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { SavedItem } from '@/types/saved'

export const useSavedItems = (selectedTags: string[] = []) => {
  const { data: savedItems, isLoading } = useQuery({
    queryKey: ['saved-items', { selectedTags }],
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
        .order('created_at', { ascending: false })

      if (selectedTags.length > 0) {
        query = query.in('tag', selectedTags)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching saved items:', error)
        throw error
      }

      return data as SavedItem[]
    }
  })

  return {
    savedItems,
    isLoading
  }
}
