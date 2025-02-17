
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import CategoryTabs from '@/components/layout/CategoryTabs';
import EmptyState from '@/components/layout/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import MessageList from '@/components/messages/MessageList';
import FolderSidebar from '@/components/messages/FolderSidebar';
import MessageHeader from '@/components/messages/MessageHeader';
import { Message } from '@/types';

type FolderItem = {
  id: string;
  label: string;
  count: number;
}

type FolderStructure = {
  [key: string]: FolderItem[];
}

type TwilioMessageLog = {
  id: string;
  status: string | null;
  error_message: string | null;
  twilio_sid: string | null;
  error_category: string | null;
  attempt: number;
  next_retry: string | null;
  retryable: boolean;
  retry_count: number;
}

type MessageWithLogs = Message & {
  twilio_message_logs: TwilioMessageLog[] | null;
}

export default function Home() {
  const [currentCategory, setCurrentCategory] = useState('inbox');
  const [messages, setMessages] = useState<{
    new: Message[];
    inbox: Message[];
    saved: Message[];
    trash: Message[];
  }>({
    new: [],
    inbox: [],
    saved: [],
    trash: [],
  });
  const { toast } = useToast();

  const [activeFolder, setActiveFolder] = useState('all');
  const [expandedFolders, setExpandedFolders] = useState(['personal']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const folders: FolderStructure = {
    personal: [
      { id: 'meetings', label: 'Meetings', count: 5 },
      { id: 'ideas', label: 'Ideas', count: 3 },
      { id: 'tasks', label: 'Tasks', count: 8 }
    ]
  };

  useEffect(() => {
    fetchMessages();
  }, [currentCategory]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for category:', currentCategory);
      setIsLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          twilio_message_logs (
            id,
            status,
            error_message,
            twilio_sid,
            error_category,
            attempt,
            next_retry,
            retryable,
            retry_count
          )
        `)
        .eq('category', currentCategory)
        .order('created_at', { ascending: false });

      console.log('Messages query result:', { data, error });

      if (error) {
        throw error;
      }

      // Transform the data to include Twilio status information
      const transformedData = (data || []).map(msg => {
        const messageLog = Array.isArray(msg.twilio_message_logs) ? msg.twilio_message_logs[0] : null;
        return {
          ...msg,
          status: messageLog?.status || 'pending',
          error_message: messageLog?.error_message || null,
          twilio_sid: messageLog?.twilio_sid || null,
          delivery_attempts: messageLog?.attempt || 0,
          next_retry: messageLog?.next_retry || null,
          retryable: messageLog?.retryable ?? true,
          error_category: messageLog?.error_category || null,
          retry_count: messageLog?.retry_count || 0
        };
      });

      // Group messages by category
      const groupedMessages = {
        new: transformedData.filter(msg => msg.category === 'new'),
        inbox: transformedData.filter(msg => msg.category === 'inbox'),
        saved: transformedData.filter(msg => msg.category === 'saved'),
        trash: transformedData.filter(msg => msg.category === 'trash'),
      };

      console.log('Grouped messages:', groupedMessages);

      setMessages(groupedMessages);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch messages. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders(current => 
      current.includes(folder) 
        ? current.filter(f => f !== folder)
        : [...current, folder]
    );
  };

  return (
    <AppLayout>
      <div className="bg-black min-h-screen">
        <CategoryTabs
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
          counts={{
            new: messages.new.length,
            inbox: messages.inbox.length,
            saved: messages.saved.length,
            trash: messages.trash.length,
          }}
        />
        
        <div className="mt-28 px-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages[currentCategory as keyof typeof messages]?.length === 0 ? (
            <div className="text-[#ffcc00]">
              <EmptyState />
            </div>
          ) : (
            <div className="flex h-[calc(100vh-8rem)]">
              <FolderSidebar
                folders={folders}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
              />

              <main className="flex-1 flex flex-col glass-panel rounded-lg">
                <MessageHeader
                  currentCategory={currentCategory}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />

                <div className="flex-1 overflow-y-auto p-4">
                  <MessageList
                    messages={messages[currentCategory as keyof typeof messages]}
                    isLoading={isLoading}
                  />
                </div>
              </main>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
