import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ShieldCheck,
  MessageSquare,
  Bookmark,
  Users,
  Pencil,
  LogOut,
  Mic,
  ChevronRight
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
  const [activeFeature, setActiveFeature] = useState('home');

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
      <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs 
        rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
        {count > 99 ? '99+' : count}
      </div>
    );
  };

  const renderFeatureGrid = () => (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
      {features.map((feature) => (
        <button
          key={feature.id}
          onClick={() => navigate(feature.path)}
          className={`w-full p-6 rounded-lg border transition-colors text-left relative
            ${feature.primary 
              ? 'border-primary bg-primary/10 hover:bg-primary/20' 
              : 'border-border bg-background hover:border-primary'}`}
        >
          <div className="flex items-center space-x-4">
            <span className="text-2xl relative">
              {feature.icon}
              {feature.badge > 0 && <NotificationBadge count={feature.badge} />}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-primary">{feature.label}</h3>
              <p className="text-muted-foreground mt-1">{feature.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderRecentMessages = () => {
    if (messages.length === 0 || unreadCount === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Recent Messages</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inbox-0')}
            className="text-muted-foreground hover:text-primary"
          >
            View all
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {messages.slice(0, 3).map((message) => (
            <Card
              key={message.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate('/inbox-0')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {message.sender.first_name?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {message.sender.first_name} {message.sender.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {message.content}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(message.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative pb-24">
      <header className="border-b border-border p-4 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-primary hover:text-primary/90"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="sr-only sm:not-sr-only">Logout</span>
        </Button>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            onClick={() => navigate('/inbox-0')}
            className="text-primary hover:text-primary/90 flex items-center gap-2"
          >
            <Badge variant="destructive" className="animate-pulse">
              {unreadCount} new
            </Badge>
            <span className="sr-only sm:not-sr-only">View Messages</span>
          </Button>
        )}
      </header>

      <main className="container mx-auto px-4">
        <div className="py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <h1 className="text-2xl font-semibold text-primary">Welcome to the App</h1>
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
          </div>

          {renderRecentMessages()}
          {renderFeatureGrid()}
        </div>
      </main>

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
