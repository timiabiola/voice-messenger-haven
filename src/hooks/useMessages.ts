
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VoiceMessage } from '@/types/messages';
import { useToast } from '@/components/ui/use-toast';

export const useMessages = () => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: recipientData, error: recipientError } = await supabase
        .from('voice_message_recipients')
        .select('voice_message_id')
        .eq('recipient_id', session.user.id);

      if (recipientError) throw recipientError;

      if (!recipientData?.length) {
        setMessages([]);
        return;
      }

      const { data: messageData, error: messageError } = await supabase
        .from('voice_messages')
        .select(`
          id,
          title,
          subject,
          audio_url,
          created_at,
          is_urgent,
          is_private,
          parent_message_id,
          thread_id,
          sender:profiles (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .in('id', recipientData.map(r => r.voice_message_id))
        .is('parent_message_id', null) // Only get root messages
        .order('created_at', { ascending: false });

      if (messageError) throw messageError;

      setMessages(messageData || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return { messages, loading, fetchMessages };
};
