
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ShieldCheck,
  MessageSquare,
  Bookmark,
  Users,
  Pencil,
  LogOut,
  Mic
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

interface Feature {
  id: string;
  label: string;
  description: string;
  icon: JSX.Element;
  badge?: number;
  primary?: boolean;
  path: string;
}

export default function Index() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);

  const features: Feature[] = [
    {
      id: 'messages',
      label: 'Messages',
      description: 'View your messages',
      icon: <MessageSquare className="w-6 h-6" />,
      badge: unreadCount,
      primary: true,
      path: '/inbox-0'
    },
    {
      id: 'notes',
      label: 'Notes',
      description: 'Create and manage your notes',
      icon: <Pencil className="w-6 h-6" />,
      path: '/notes'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      description: 'Manage your contacts',
      icon: <Users className="w-6 h-6" />,
      path: '/contacts'
    },
    {
      id: 'saved',
      label: 'Saved items',
      description: 'Access your saved content',
      icon: <Bookmark className="w-6 h-6" />,
      path: '/saved'
    }
  ];

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          status,
          sender:profiles!messages_sender_id_fkey(first_name, last_name)
        `)
        .eq('recipient_id', session.session.user.id)
        .eq('status', 'unread');

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
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const NotificationBadge = ({ count }: { count: number }) => {
    if (!count) return null;
    return (
      <Badge 
        variant="destructive" 
        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
      >
        {count > 99 ? '99+' : count}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background relative">
      <header className="border-b p-4 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={() => navigate('/inbox-0')}
            className="flex items-center gap-2"
          >
            <Badge variant="destructive">{unreadCount} new</Badge>
            View Messages
          </Button>
        )}
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Welcome to the App</h1>
          {isAdmin && (
            <Button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
              variant="outline"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Dashboard
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Button
              key={feature.id}
              onClick={() => navigate(feature.path)}
              className={`h-auto p-6 flex flex-col items-start space-y-2 relative ${
                feature.primary 
                  ? 'border-primary bg-primary/10 hover:bg-primary/20' 
                  : 'border-border bg-background hover:border-primary'
              }`}
              variant="outline"
            >
              <span className="text-2xl relative">
                {feature.icon}
                {feature.badge > 0 && <NotificationBadge count={feature.badge} />}
              </span>
              <div className="text-left">
                <h3 className="text-lg font-semibold">{feature.label}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </main>

      {/* Floating Mic Button */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full shadow-lg hover:shadow-xl transition-all w-12 h-12 bg-primary"
        onClick={() => navigate('/microphone')}
      >
        <Mic className="w-6 h-6" />
      </Button>
    </div>
  );
}
