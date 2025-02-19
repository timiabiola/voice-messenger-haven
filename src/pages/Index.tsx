
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  PenSquare, 
  Users, 
  Bookmark,
  Mic,
  Shield,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="w-full py-4 px-4 md:px-6 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-[1000px] mx-auto flex justify-between items-center">
          <button 
            onClick={handleLogout}
            className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-amber-400 text-black rounded-full text-sm font-medium flex items-center gap-2 hover:bg-amber-300 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 w-full pt-8 md:pt-16 pb-24 flex items-center justify-center">
        <div className="w-full max-w-[90vw] md:max-w-[80vw] lg:max-w-[1000px] mx-auto px-4">
          <div className="w-full">
            <div className="space-y-4 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <button 
                  onClick={() => navigate('/inbox-0')}
                  className="group p-4 md:p-6 bg-zinc-900/50 rounded-xl md:rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-2 md:p-3 bg-amber-400/10 rounded-lg md:rounded-xl">
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-amber-400 mb-1 md:mb-2">Messages</h3>
                      <p className="text-sm md:text-base text-gray-400">View your messages</p>
                      {unreadCount > 0 && (
                        <span className="inline-block mt-2 text-xs md:text-sm text-amber-400">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/notes')}
                  className="group p-4 md:p-6 bg-zinc-900/50 rounded-xl md:rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-2 md:p-3 bg-amber-400/10 rounded-lg md:rounded-xl">
                      <PenSquare className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-amber-400 mb-1 md:mb-2">Notes</h3>
                      <p className="text-sm md:text-base text-gray-400">Create and manage your notes</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/contacts')}
                  className="group p-4 md:p-6 bg-zinc-900/50 rounded-xl md:rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-2 md:p-3 bg-amber-400/10 rounded-lg md:rounded-xl">
                      <Users className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-amber-400 mb-1 md:mb-2">Contacts</h3>
                      <p className="text-sm md:text-base text-gray-400">Manage your contacts</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/saved')}
                  className="group p-4 md:p-6 bg-zinc-900/50 rounded-xl md:rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-2 md:p-3 bg-amber-400/10 rounded-lg md:rounded-xl">
                      <Bookmark className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-amber-400 mb-1 md:mb-2">Saved items</h3>
                      <p className="text-sm md:text-base text-gray-400">Access your saved content</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <button 
        onClick={() => navigate('/microphone')}
        className="fixed bottom-6 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-300 transition-colors group"
      >
        <Mic className="w-5 h-5 md:w-6 md:h-6 text-black" />
        <span className="absolute -top-10 right-0 bg-black text-amber-400 text-xs md:text-sm py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          Record
        </span>
      </button>
    </div>
  );
}
