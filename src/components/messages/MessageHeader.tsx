
import { AlertTriangle, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from './types';

interface MessageHeaderProps {
  message: Message;
}

export const MessageHeader = ({ message }: MessageHeaderProps) => {
  const senderName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || message.sender.email;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-amber-400 mb-1 truncate">{message.subject}</h3>
        <p className="text-sm text-gray-400 truncate">From: {senderName}</p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        {message.is_urgent && (
          <span className="shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </span>
        )}
        {message.is_private && (
          <span className="shrink-0">
            <Lock className="w-4 h-4 text-amber-400" />
          </span>
        )}
      </div>
    </div>
  );
};
