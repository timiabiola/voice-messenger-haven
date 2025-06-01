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
          <span className="shrink-0" title="Urgent message">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </span>
        )}
        {message.is_private && (
          <span 
            className="shrink-0 flex items-center gap-1 px-2 py-1 bg-zinc-800/50 rounded-full border border-zinc-700" 
            title="Private - Cannot be forwarded"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Private</span>
          </span>
        )}
      </div>
    </div>
  );
};
