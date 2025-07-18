import React, { useState } from 'react';
import { VoiceMessage } from '@/types/messages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ThreadedMessageViewProps {
  message: VoiceMessage;
  onReply?: (messageId: string) => void;
  depth?: number;
  maxDepth?: number;
}

export const ThreadedMessageView: React.FC<ThreadedMessageViewProps> = ({
  message,
  onReply,
  depth = 0,
  maxDepth = 5
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasReplies = message.replies && message.replies.length > 0;
  
  const initials = `${message.sender.first_name?.[0] || ''}${message.sender.last_name?.[0] || ''}`.toUpperCase() || 'U';

  return (
    <div className={cn("w-full", depth > 0 && "ml-8 mt-2")}>
      <Card className={cn(
        "transition-all duration-200",
        depth === 0 ? "shadow-md" : "shadow-sm border-l-2 border-l-primary/20"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  {message.sender.first_name} {message.sender.last_name}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
              
              <h4 className="font-semibold text-sm mt-1">{message.title}</h4>
              {message.subject && (
                <p className="text-sm text-muted-foreground mt-1">{message.subject}</p>
              )}
            </div>

            {depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply?.(message.id)}
                className="shrink-0"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Reply
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Audio player would go here */}
          <div className="bg-muted rounded-md p-3 text-sm text-muted-foreground">
            [Audio Player Component - {message.audio_url}]
          </div>

          {hasReplies && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {message.replies!.length} {message.replies!.length === 1 ? 'reply' : 'replies'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {hasReplies && isExpanded && (
        <div className="mt-2">
          {message.replies!.map((reply) => (
            <ThreadedMessageView
              key={reply.id}
              message={reply}
              onReply={onReply}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
};