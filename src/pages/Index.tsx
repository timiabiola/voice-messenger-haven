
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  PenSquare, 
  Users, 
  Bookmark,
  Shield,
  Mic,
  LogOut
} from 'lucide-react';

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

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
    <div className="flex flex-col min-h-screen bg-black">
      {/* Top Bar */}
      <div className="w-full py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={handleLogout}
            className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-amber-400 mb-4">
              Welcome to Voice Haven
            </h2>
            <p className="text-zinc-400">Your secure space for voice messaging</p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-0">
            {/* Messages */}
            <button 
              onClick={() => navigate('/inbox-0')}
              className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-amber-400/10 rounded-xl group-hover:bg-amber-400/20 transition-colors">
                  <MessageSquare className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Messages</h3>
                  <p className="text-sm text-zinc-400">View your messages</p>
                </div>
              </div>
              {unreadCount > 0 && (
                <span className="text-sm text-amber-400">{unreadCount} unread messages</span>
              )}
            </button>

            {/* Notes */}
            <button 
              onClick={() => navigate('/notes')}
              className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-400/10 rounded-xl group-hover:bg-amber-400/20 transition-colors">
                  <PenSquare className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Notes</h3>
                  <p className="text-sm text-zinc-400">Create and manage your notes</p>
                </div>
              </div>
            </button>

            {/* Contacts */}
            <button 
              onClick={() => navigate('/contacts')}
              className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-400/10 rounded-xl group-hover:bg-amber-400/20 transition-colors">
                  <Users className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Contacts</h3>
                  <p className="text-sm text-zinc-400">Manage your contacts</p>
                </div>
              </div>
            </button>

            {/* Saved Items */}
            <button 
              onClick={() => navigate('/saved')}
              className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-400/10 rounded-xl group-hover:bg-amber-400/20 transition-colors">
                  <Bookmark className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Saved items</h3>
                  <p className="text-sm text-zinc-400">Access your saved content</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
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
