
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out');
      return;
    }
    navigate('/auth');
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Top Bar */}
      <div className="w-full py-4 px-6 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
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

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 pb-8">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-12">
              {/* Welcome Section */}
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-amber-400 mb-4">
                  Welcome to Voice Haven
                </h1>
                <p className="text-gray-400 text-lg">
                  Your secure space for voice messaging
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Messages */}
                <button 
                  onClick={() => navigate('/inbox-0')}
                  className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-400/10 rounded-xl">
                      <MessageSquare className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-amber-400 mb-2">Messages</h3>
                      <p className="text-gray-400">View your messages</p>
                      {unreadCount > 0 && (
                        <span className="inline-block mt-2 text-sm text-amber-400">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Notes */}
                <button 
                  onClick={() => navigate('/notes')}
                  className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-400/10 rounded-xl">
                      <PenSquare className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-amber-400 mb-2">Notes</h3>
                      <p className="text-gray-400">Create and manage your notes</p>
                    </div>
                  </div>
                </button>

                {/* Contacts */}
                <button 
                  onClick={() => navigate('/contacts')}
                  className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-400/10 rounded-xl">
                      <Users className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-amber-400 mb-2">Contacts</h3>
                      <p className="text-gray-400">Manage your contacts</p>
                    </div>
                  </div>
                </button>

                {/* Saved Items */}
                <button 
                  onClick={() => navigate('/saved')}
                  className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-amber-400/10 rounded-xl">
                      <Bookmark className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-amber-400 mb-2">Saved items</h3>
                      <p className="text-gray-400">Access your saved content</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Record Button */}
      <button 
        onClick={() => navigate('/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-300 transition-colors group"
      >
        <Mic className="w-6 h-6 text-black" />
        <span className="absolute -top-10 right-0 bg-black text-amber-400 text-sm py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          Record
        </span>
      </button>
    </div>
  );
}
