
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import AppLayout from '@/components/AppLayout';
import EmptyState from '@/components/layout/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface VoiceMessage {
  id: string;
  title: string;
  subject: string;
  audio_url: string;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    email: string;
  };
  is_urgent: boolean;
  is_private: boolean;
}

const Inbox = () => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Updated query with correct PostgREST syntax
      const { data, error } = await supabase
        .from('voice_message_recipients')
        .select(`
          voice_message:voice_message_id (
            id,
            title,
            subject,
            audio_url,
            created_at,
            is_urgent,
            is_private,
            sender:sender_id (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('recipient_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedMessages = data
        ?.filter(item => item.voice_message && item.voice_message.sender)
        .map(item => ({
          ...item.voice_message,
          sender: item.voice_message.sender
        })) as VoiceMessage[];

      setMessages(transformedMessages || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="p-4">
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="p-4 hover:bg-accent/10 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{message.subject || 'No Subject'}</h3>
                  <p className="text-sm text-muted-foreground">
                    From: {message.sender.first_name} {message.sender.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {message.is_urgent && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Urgent
                    </span>
                  )}
                  {message.is_private && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Private
                    </span>
                  )}
                </div>
              </div>
              <audio className="mt-2 w-full" controls src={message.audio_url} />
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Inbox;
