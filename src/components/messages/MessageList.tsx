
import { Message } from '@/types';
import { formatDate } from '@/lib/utils';
import { AlertCircle, Clock } from 'lucide-react';
import { getStatusInfo } from '@/lib/statusMapping';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      {messages.map((message) => {
        const statusInfo = getStatusInfo(message.status);
        
        return (
          <div key={message.id} className="glass-panel rounded-lg p-4 hover:bg-accent/10 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{message.title || 'Untitled Message'}</h3>
                {message.error_message && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center text-destructive">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs">Error</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{message.error_message}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{formatDate(message.created_at || '')}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-muted-foreground capitalize">{message.category}</span>
              {message.status && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{statusInfo.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {message.delivery_attempts > 0 && (
                <span className="text-xs text-muted-foreground">
                  Attempts: {message.delivery_attempts}
                </span>
              )}
              {message.next_retry && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Next retry</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Scheduled for: {formatDate(message.next_retry)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {message.status === 'failed' && message.retryable === false && (
                <span className="text-xs text-destructive">
                  No more retries
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
