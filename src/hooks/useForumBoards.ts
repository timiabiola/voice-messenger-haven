import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ForumBoard } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export const useForumBoards = () => {
  return useQuery({
    queryKey: ['forum-boards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_boards')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching forum boards:', error);
        toast.error('Failed to load forum boards');
        throw error;
      }

      return data as ForumBoard[];
    },
  });
};

export const useForumBoard = (slug: string) => {
  return useQuery({
    queryKey: ['forum-board', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_boards')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching forum board:', error);
        toast.error('Failed to load forum board');
        throw error;
      }

      return data as ForumBoard;
    },
    enabled: !!slug,
  });
};