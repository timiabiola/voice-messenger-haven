import { AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from './types';

interface MessageHeaderProps {
  message: Message;
}

export const MessageHeader = ({ message }: MessageHeaderProps) => {
  const senderName = `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || message.sender.email;

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-amber-400 mb-1 truncate">{message.subject}</h3>
        <p className="text-sm text-gray-400 truncate">From: {senderName}</p>
        <p className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
      
      {message.is_urgent && (
        <div className="flex-shrink-0">
          <span 
            className="flex items-center gap-1 px-2 py-1 bg-red-900/30 rounded-full border border-red-700/50 whitespace-nowrap" 
            title="Urgent message"
          >
            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-400 font-medium">Urgent</span>
          </span>
        </div>
      )}
    </div>
  );
};
