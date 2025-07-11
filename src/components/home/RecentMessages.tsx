
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/utils';
import { formatNameWithInitial } from '@/lib/utils';

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

interface RecentMessagesProps {
  messages: Message[];
  unreadCount: number;
}

export const RecentMessages = ({ messages, unreadCount }: RecentMessagesProps) => {
  const navigate = useNavigate();

  if (messages.length === 0 || unreadCount === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
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
      <div className="space-y-2">
        {messages.slice(0, 3).map((message) => (
          <Card
            key={message.id}
            className="cursor-pointer hover:bg-accent/50 active:bg-accent/75 transition-colors"
            onClick={() => navigate('/inbox-0')}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                    <span className="text-primary font-medium">
                      {message.sender.first_name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {formatNameWithInitial(message.sender.first_name, message.sender.last_name)}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {message.content}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground ml-2">
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
