import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ForumReply } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export const useForumReplies = (postId: string) => {
  return useQuery({
    queryKey: ['forum-replies', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_replies')
        .select(`
          *,
          author:profiles(id, first_name, last_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching forum replies:', error);
        toast.error('Failed to load replies');
        throw error;
      }

      return data as ForumReply[];
    },
    enabled: !!postId,
  });
};

export const useCreateForumReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('forum_replies')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', data.post_id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      toast.success('Reply posted successfully');
    },
    onError: (error) => {
      console.error('Error creating reply:', error);
      toast.error('Failed to post reply');
    },
  });
};

export const useUpdateForumReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId, content }: { replyId: string; content: string }) => {
      const { data, error } = await supabase
        .from('forum_replies')
        .update({
          content,
          is_edited: true,
        })
        .eq('id', replyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', data.post_id] });
      toast.success('Reply updated successfully');
    },
    onError: (error) => {
      console.error('Error updating reply:', error);
      toast.error('Failed to update reply');
    },
  });
};

export const useDeleteForumReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ replyId, postId }: { replyId: string; postId: string }) => {
      const { error } = await supabase
        .from('forum_replies')
        .delete()
        .eq('id', replyId);

      if (error) throw error;
      return { postId };
    },
    onSuccess: ({ postId }) => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      toast.success('Reply deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    },
  });
};