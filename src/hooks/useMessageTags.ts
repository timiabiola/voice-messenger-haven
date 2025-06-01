import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMessageTags = (savedItemId?: string) => {
  const queryClient = useQueryClient();

  // Get tags for a specific saved item
  const { data: messageTags, isLoading } = useQuery({
    queryKey: ['message-tags', savedItemId],
    queryFn: async () => {
      if (!savedItemId) return [];

      const { data, error } = await supabase
        .from('saved_items_tags')
        .select(`
          tag_id,
          tags (
            id,
            name
          )
        `)
        .eq('saved_item_id', savedItemId);

      if (error) {
        console.error('Error fetching message tags:', error);
        return [];
      }

      return data?.map(item => item.tags).filter(Boolean) || [];
    },
    enabled: !!savedItemId,
  });

  // Add tags to a saved item
  const addTags = useMutation({
    mutationFn: async ({ savedItemId, tagIds }: { savedItemId: string; tagIds: string[] }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error('No user session');

      // First, get existing tag associations
      const { data: existingTags } = await supabase
        .from('saved_items_tags')
        .select('tag_id')
        .eq('saved_item_id', savedItemId);

      const existingTagIds = existingTags?.map(t => t.tag_id) || [];
      
      // Filter out already associated tags
      const newTagIds = tagIds.filter(id => !existingTagIds.includes(id));

      if (newTagIds.length === 0) {
        return { success: true, message: 'Tags already associated' };
      }

      // Insert new tag associations
      const { error } = await supabase
        .from('saved_items_tags')
        .insert(
          newTagIds.map(tagId => ({
            saved_item_id: savedItemId,
            tag_id: tagId,
          }))
        );

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-tags', savedItemId] });
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      toast.success('Tags added successfully');
    },
    onError: (error) => {
      console.error('Error adding tags:', error);
      toast.error('Failed to add tags');
    },
  });

  // Remove a tag from a saved item
  const removeTag = useMutation({
    mutationFn: async ({ savedItemId, tagId }: { savedItemId: string; tagId: string }) => {
      const { error } = await supabase
        .from('saved_items_tags')
        .delete()
        .eq('saved_item_id', savedItemId)
        .eq('tag_id', tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-tags', savedItemId] });
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      toast.success('Tag removed');
    },
    onError: (error) => {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    },
  });

  // Add tags by name (creates tags if they don't exist)
  const addTagsByName = useMutation({
    mutationFn: async ({ savedItemId, tagNames }: { savedItemId: string; tagNames: string[] }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error('No user session');

      // Get or create tags
      const tagIds: string[] = [];

      for (const tagName of tagNames) {
        // Check if tag exists
        let { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .eq('user_id', session.session.user.id)
          .single();

        if (!existingTag) {
          // Create new tag
          const { data: newTag, error: createError } = await supabase
            .from('tags')
            .insert({
              name: tagName,
              user_id: session.session.user.id,
            })
            .select('id')
            .single();

          if (createError) throw createError;
          existingTag = newTag;
        }

        if (existingTag) {
          tagIds.push(existingTag.id);
        }
      }

      // Add the tags to the saved item
      return addTags.mutateAsync({ savedItemId, tagIds });
    },
  });

  return {
    messageTags,
    isLoading,
    addTags: addTags.mutate,
    removeTag: removeTag.mutate,
    addTagsByName: addTagsByName.mutate,
    isAdding: addTags.isPending || addTagsByName.isPending,
    isRemoving: removeTag.isPending,
  };
}; 