import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VoiceMessage } from '@/types/messages';
import { useToast } from '@/components/ui/use-toast';

export const useThreadedMessages = (threadId?: string) => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchThreadMessages = async () => {
    if (!threadId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_thread_messages', { p_thread_id: threadId });

      if (error) throw error;

      // Fetch sender information for each message
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg: any) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender: senderData || {
              id: msg.sender_id,
              first_name: 'Unknown',
              last_name: 'User',
              email: ''
            }
          };
        })
      );

      // Build tree structure
      const messageMap = new Map<string, VoiceMessage>();
      const rootMessages: VoiceMessage[] = [];

      // First pass: create all messages
      messagesWithSenders.forEach(msg => {
        messageMap.set(msg.id, { ...msg, replies: [] });
      });

      // Second pass: build tree
      messagesWithSenders.forEach(msg => {
        const message = messageMap.get(msg.id)!;
        if (msg.parent_message_id) {
          const parent = messageMap.get(msg.parent_message_id);
          if (parent) {
            parent.replies!.push(message);
          }
        } else {
          rootMessages.push(message);
        }
      });

      setMessages(rootMessages);
    } catch (error: any) {
      console.error('Error fetching thread messages:', error);
      toast({
        title: "Error",
        description: "Failed to load thread messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const replyToMessage = async (
    parentMessageId: string,
    replyData: {
      title: string;
      subject: string;
      audio_url: string;
      is_urgent?: boolean;
      is_private?: boolean;
    }
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Create the reply message
      const { data: message, error: messageError } = await supabase
        .from('voice_messages')
        .insert({
          ...replyData,
          sender_id: session.user.id,
          parent_message_id: parentMessageId
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Copy recipients from parent message
      const { data: parentRecipients, error: recipientsError } = await supabase
        .from('voice_message_recipients')
        .select('recipient_id')
        .eq('voice_message_id', parentMessageId);

      if (recipientsError) throw recipientsError;

      // Add recipients to the reply
      if (parentRecipients && parentRecipients.length > 0) {
        const recipientInserts = parentRecipients.map(r => ({
          voice_message_id: message.id,
          recipient_id: r.recipient_id
        }));

        const { error: insertError } = await supabase
          .from('voice_message_recipients')
          .insert(recipientInserts);

        if (insertError) throw insertError;
      }

      // Refresh the thread
      await fetchThreadMessages();

      toast({
        title: "Success",
        description: "Reply sent successfully"
      });

      return message;
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchThreadMessages();
  }, [threadId]);

  // Set up real-time subscription for thread updates
  useEffect(() => {
    if (!threadId) return;

    const subscription = supabase
      .channel(`thread_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_messages',
          filter: `thread_id=eq.${threadId}`
        },
        () => {
          fetchThreadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [threadId]);

  return { 
    messages, 
    loading, 
    fetchThreadMessages,
    replyToMessage
  };
};