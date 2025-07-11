import { VoiceMessage } from '@/types/messages';
import { formatNameWithInitial } from '@/lib/utils';

interface MessageHeaderProps {
  message: VoiceMessage;
}

export const MessageHeader = ({ message }: MessageHeaderProps) => {
  const senderName = formatNameWithInitial(message.sender.first_name, message.sender.last_name);

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-foreground mb-1">{message.subject || 'Voice Message'}</h2>
      <p className="text-sm text-gray-400 truncate">From: {senderName}</p>
    </div>
  );
};
