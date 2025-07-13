import { VoiceMessage } from '@/types/messages';
import { formatNameWithInitial } from '@/lib/utils';
import { User } from 'lucide-react';

interface MessageHeaderProps {
  message: VoiceMessage;
}

export const MessageHeader = ({ message }: MessageHeaderProps) => {
  const senderName = formatNameWithInitial(message.sender.first_name, message.sender.last_name);
  const initials = (
    (message.sender.first_name?.[0] || '') + 
    (message.sender.last_name?.[0] || '')
  ).toUpperCase() || 'U';

  return (
    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
      {/* Avatar */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800 flex items-center justify-center text-amber-400 font-semibold text-sm sm:text-base shrink-0">
        {initials || <User className="w-4 h-4 sm:w-5 sm:h-5" />}
      </div>
      
      {/* Message info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-base sm:text-lg font-semibold text-white truncate">
          {message.subject || 'Voice Message'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 truncate">
          {senderName}
        </p>
        {message.is_urgent && (
          <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-red-400">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full animate-pulse" />
            Urgent
          </span>
        )}
      </div>
    </div>
  );
};
