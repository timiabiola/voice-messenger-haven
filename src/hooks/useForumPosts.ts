import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ForumPost, ForumPostStats } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useEffect } from 'react';

export const useForumPosts = (boardId?: string) => {
  return useQuery({
    queryKey: ['forum-posts', boardId],
    queryFn: async () => {
      let query = supabase
        .from('forum_post_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (boardId) {
        query = query.eq('board_id', boardId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching forum posts:', error);
        toast.error('Failed to load forum posts');
        throw error;
      }

      return data as ForumPostStats[];
    },
    enabled: boardId !== undefined,
  });
};

export const useForumPost = (postId: string) => {
  const queryClient = useQueryClient();

  // Subscribe to real-time updates for replies
  useEffect(() => {
    const channel = supabase
      .channel(`forum-post-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forum_replies',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['forum-post', postId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

  return useQuery({
    queryKey: ['forum-post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          board:forum_boards(*),
          author:profiles(id, first_name, last_name, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching forum post:', error);
        toast.error('Failed to load forum post');
        throw error;
      }

      // Increment view count
      await supabase
        .from('forum_posts')
        .update({ view_count: data.view_count + 1 })
        .eq('id', postId);

      return data as ForumPost;
    },
    enabled: !!postId,
  });
};

export const useCreateForumPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, title, content }: { boardId: string; title: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          board_id: boardId,
          user_id: user.id,
          title,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts', data.board_id] });
      toast.success('Post created successfully');
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    },
  });
};

export const useUpdateForumPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, title, content }: { postId: string; title: string; content: string }) => {
      const { data, error } = await supabase
        .from('forum_posts')
        .update({
          title,
          content,
          is_edited: true,
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forum-post', data.id] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      toast.success('Post updated successfully');
    },
    onError: (error) => {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    },
  });
};

export const useDeleteForumPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      toast.success('Post deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    },
  });
};