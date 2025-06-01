import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useSaveMessage = (messageId?: string) => {
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);

  // Check if a message is saved
  const { data: savedItem } = useQuery({
    queryKey: ['saved-message', messageId],
    queryFn: async () => {
      if (!messageId) return null;
      
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return null;

      // Using category to identify saved voice messages
      const { data, error } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', session.session.user.id)
        .eq('category', 'voice_message')
        .eq('content', messageId) // Store message ID in content field
        .is('deleted_at', null)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking saved status:', error);
      }

      return data;
    },
    enabled: !!messageId,
  });

  useEffect(() => {
    setIsSaved(!!savedItem);
  }, [savedItem]);

  // Save message mutation
  const saveMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error('No user session');

      // Get message details
      const { data: message, error: messageError } = await supabase
        .from('voice_messages')
        .select(`
          subject, 
          sender_id,
          sender:profiles!voice_messages_sender_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', messageId)
        .single();

      if (messageError) throw messageError;

      const { data, error } = await supabase
        .from('saved_items')
        .insert({
          user_id: session.session.user.id,
          category: 'voice_message',
          title: message.subject || 'Voice Message',
          content: messageId, // Store the message ID in content field
          sender_id: message.sender_id,
          is_read: true,
          is_flagged: false,
        })
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-message', messageId] });
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      queryClient.invalidateQueries({ queryKey: ['recent-saved-messages'] });
      toast.success('Message saved');
      setIsSaved(true);
    },
    onError: (error) => {
      console.error('Error saving message:', error);
      toast.error('Failed to save message');
    },
  });

  // Unsave message mutation
  const unsaveMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error('No user session');

      const { error } = await supabase
        .from('saved_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', session.session.user.id)
        .eq('category', 'voice_message')
        .eq('content', messageId)
        .is('deleted_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-message', messageId] });
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      queryClient.invalidateQueries({ queryKey: ['recent-saved-messages'] });
      toast.success('Message removed from saved');
      setIsSaved(false);
    },
    onError: (error) => {
      console.error('Error unsaving message:', error);
      toast.error('Failed to remove message from saved');
    },
  });

  const toggleSave = async () => {
    if (!messageId) return;
    
    if (isSaved) {
      await unsaveMutation.mutateAsync(messageId);
    } else {
      await saveMutation.mutateAsync(messageId);
    }
  };

  return {
    isSaved,
    isLoading: saveMutation.isPending || unsaveMutation.isPending,
    toggleSave,
    saveMessage: saveMutation.mutate,
    unsaveMessage: unsaveMutation.mutate,
  };
};

// Hook to get recent saved messages
export const useRecentSavedMessages = (limit = 5) => {
  return useQuery({
    queryKey: ['recent-saved-messages', limit],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return [];

      // First get saved items
      const { data: savedItems, error: savedError } = await supabase
        .from('saved_items')
        .select(`
          id,
          content,
          title,
          created_at,
          sender:profiles!fk_saved_items_sender(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', session.session.user.id)
        .eq('category', 'voice_message')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (savedError || !savedItems) {
        console.error('Error fetching saved items:', savedError);
        return [];
      }

      // Get the voice messages for these saved items
      const messageIds = savedItems.map(item => item.content).filter(Boolean);
      
      if (messageIds.length === 0) return [];

      const { data: messages, error: messagesError } = await supabase
        .from('voice_messages')
        .select(`
          id,
          subject,
          audio_url,
          created_at
        `)
        .in('id', messageIds);

      if (messagesError || !messages) {
        console.error('Error fetching messages:', messagesError);
        return [];
      }

      // Combine the data
      return savedItems.map(savedItem => {
        const message = messages.find(m => m.id === savedItem.content);
        return {
          id: savedItem.id,
          saved_at: savedItem.created_at,
          voice_message: message ? {
            ...message,
            sender: savedItem.sender
          } : null
        };
      }).filter(item => item.voice_message !== null);
    },
  });
}; 