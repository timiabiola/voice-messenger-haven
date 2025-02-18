
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import EmptyState from '@/components/layout/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // First get the voice message IDs for this recipient
      const { data: recipientData, error: recipientError } = await supabase
        .from('voice_message_recipients')
        .select('voice_message_id')
        .eq('recipient_id', session.user.id);

      if (recipientError) throw recipientError;

      if (!recipientData?.length) {
        setMessages([]);
        return;
      }

      // Then fetch the full message data with sender information
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
          sender:profiles (
            first_name,
            last_name,
            email
          )
        `)
        .in('id', recipientData.map(r => r.voice_message_id))
        .order('created_at', { ascending: false });

      if (messageError) throw messageError;

      const transformedMessages = (messageData || []).map(message => ({
        id: message.id,
        title: message.title || '',
        subject: message.subject || '',
        audio_url: message.audio_url,
        created_at: message.created_at,
        is_urgent: message.is_urgent || false,
        is_private: message.is_private || false,
        sender: {
          first_name: message.sender?.first_name || '',
          last_name: message.sender?.last_name || '',
          email: message.sender?.email || ''
        }
      }));

      setMessages(transformedMessages);
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
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Admin Panel
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)]">
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
