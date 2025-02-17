
import { Message } from '@/types';
import { formatDate } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

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
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{message.title || 'Untitled Message'}</h3>
              {message.error_message && (
                <div className="flex items-center text-destructive">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-xs">Error: {message.error_message}</span>
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{formatDate(message.created_at || '')}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-xs text-muted-foreground capitalize">{message.category}</span>
            {message.status && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                message.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                message.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                'bg-red-500/20 text-red-500'
              }`}>
                {message.status}
              </span>
            )}
            {message.delivery_attempts > 0 && (
              <span className="text-xs text-muted-foreground">
                Attempts: {message.delivery_attempts}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
