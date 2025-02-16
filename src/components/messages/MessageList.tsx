
import { Message } from '@/types';
import { formatDate } from '@/lib/utils';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
};

const MessageList = ({ messages, isLoading }: MessageListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="glass-panel rounded-lg p-4 hover:bg-accent/10 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-foreground">{message.title || 'Untitled Message'}</h3>
            <span className="text-sm text-muted-foreground">{formatDate(message.created_at || '')}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-xs text-muted-foreground capitalize">{message.category}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
