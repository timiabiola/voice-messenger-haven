
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/home/TopBar';
import { FeatureGrid } from '@/components/home/FeatureGrid';
import { RecordButton } from '@/components/home/RecordButton';

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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          navigate('/auth');
          return;
        }

        if (!session) {
          console.log('No active session found');
          navigate('/auth');
          return;
        }

        // Session exists, fetch messages
        const fetchUnreadMessages = async () => {
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
            query.eq('recipient_id', session.user.id);
          }

          const { data, error: fetchError } = await query;

          if (fetchError) {
            console.error('Error fetching messages:', fetchError);
            toast.error('Failed to fetch messages');
            return;
          }

          if (data) {
            setMessages(data as Message[]);
            setUnreadCount(data.length);
          }
        };

        await fetchUnreadMessages();
      } catch (error) {
        console.error('Session check error:', error);
        toast.error('Authentication error');
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up realtime subscription
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
  }, [isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <TopBar isAdmin={isAdmin} />
      
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-screen-xl mx-auto flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <div className="grid place-items-center">
              <FeatureGrid unreadCount={unreadCount} />
            </div>
          </div>
        </div>
      </main>

      <RecordButton />
    </div>
  );
}
