
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <HomeHeader unreadCount={unreadCount} isAdmin={isAdmin} />
      <main className={`flex-1 flex justify-center ${
        isMobile 
          ? 'items-start pt-24 pb-32 px-4' 
          : 'items-center px-4 min-h-[calc(100vh-160px)]'
      }`}>
        <div className={`w-full mx-auto space-y-6 ${
          isMobile ? 'max-w-lg' : 'max-w-xl'
        }`}>
          <div className={`${isMobile ? 'px-0' : 'px-4'}`}>
            <RecentMessages messages={messages} unreadCount={unreadCount} />
            <FeatureGrid unreadCount={unreadCount} />
          </div>
        </div>
      </main>
      <MicrophoneButton />
    </div>
  );
}
