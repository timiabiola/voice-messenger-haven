import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { HomeHeader } from '@/components/home/HomeHeader';
import { FeatureGrid } from '@/components/home/FeatureGrid';
import { RecentMessages } from '@/components/home/RecentMessages';
import { MicrophoneButton } from '@/components/home/MicrophoneButton';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  content: string;
  created_at: string;
  status: 'read' | 'unread';
  sender: {
    first_name: string | null;
    last_name: string | null;
  };
}

export default function Index() {
  const { isAdmin } = useAdmin();
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const query = supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          status,
          sender:profiles!messages_sender_id_fkey(first_name, last_name)
        `)
        .eq('status', 'unread')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query.eq('recipient_id', session.session.user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to fetch messages');
        return;
      }

      if (data) {
        setMessages(data as Message[]);
        setUnreadCount(data.length);
      }
    };

    fetchUnreadMessages();

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (payload.new && payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            setMessages(prev => [newMessage, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HomeHeader unreadCount={unreadCount} isAdmin={isAdmin} />
      <main className="flex-1 w-full flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl px-4">
          <div className="grid gap-6">
            <h1 className="text-3xl font-bold text-primary text-center">
              Welcome to Voice Haven
            </h1>
            <RecentMessages messages={messages} unreadCount={unreadCount} />
            <FeatureGrid unreadCount={unreadCount} />
          </div>
        </div>
      </main>
      <MicrophoneButton />
    </div>
  );
}
