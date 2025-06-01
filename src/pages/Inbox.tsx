
import { useState } from 'react';
import EmptyState from '@/components/layout/EmptyState';
import AppLayout from '@/components/AppLayout';
import { MessageCard } from '@/components/messages/MessageCard';
import { useMessages } from '@/hooks/useMessages';

const Inbox = () => {
  const { messages, loading } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (messages.length === 0) {
    return (
      <AppLayout>
        <EmptyState />
      </AppLayout>
    );
  }

  const filteredMessages = messages.filter(message => 
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${message.sender.first_name} ${message.sender.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout onSearch={handleSearch} unreadCount={messages.length}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full pt-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1400px]">
          <div className="space-y-4 py-4">
            {filteredMessages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Inbox;
