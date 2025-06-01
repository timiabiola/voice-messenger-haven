import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { NoteTag } from '@/types/notes';

export function useNoteTags(userId: string | null) {
  const { toast } = useToast();
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('note_tags')
          .select('*')
          .eq('user_id', userId)
          .order('name');

        if (error) throw error;
        setTags(data || []);
      } catch (error) {
        console.error('Error fetching tags:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load tags"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [userId, toast]);

  const createTag = async (name: string, color?: string) => {
    if (!userId || !name) return null;

    try {
      const { data, error } = await supabase
        .from('note_tags')
        .insert({
          name,
          color: color || '#808080',
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      setTags(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create tag"
      });
      return null;
    }
  };

  const updateTag = async (tagId: string, updates: { name?: string; color?: string }) => {
    try {
      const { data, error } = await supabase
        .from('note_tags')
        .update(updates)
        .eq('id', tagId)
        .select()
        .single();

      if (error) throw error;
      setTags(prev => prev.map(tag => tag.id === tagId ? data : tag));
      return data;
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tag"
      });
      return null;
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('note_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete tag"
      });
      return false;
    }
  };

  const addTagToNote = async (noteId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('note_tags_relations')
        .insert({
          note_id: noteId,
          tag_id: tagId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding tag to note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add tag to note"
      });
      return false;
    }
  };

  const removeTagFromNote = async (noteId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('note_tags_relations')
        .delete()
        .eq('note_id', noteId)
        .eq('tag_id', tagId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing tag from note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove tag from note"
      });
      return false;
    }
  };

  const getNoteTags = async (noteId: string): Promise<NoteTag[]> => {
    try {
      const { data, error } = await supabase
        .from('note_tags_relations')
        .select(`
          tag_id,
          note_tags:note_tags(*)
        `)
        .eq('note_id', noteId);

      if (error) throw error;
      return data?.map((relation: any) => relation.note_tags).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching note tags:', error);
      return [];
    }
  };

  return {
    tags,
    isLoading,
    createTag,
    updateTag,
    deleteTag,
    addTagToNote,
    removeTagFromNote,
    getNoteTags
  };
} 