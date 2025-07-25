
import { MessageSquare, PenSquare, Users, Bookmark, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeatureButton } from './FeatureButton';

interface FeatureGridProps {
  unreadCount: number;
}

export const FeatureGrid = ({ unreadCount }: FeatureGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3 w-full max-w-lg sm:max-w-2xl">
      {/* First two rows - 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FeatureButton
          icon={MessageSquare}
          title="Messages"
          description="View your messages"
          onClick={() => navigate('/inbox')}
          showNotificationBadge={true}
          notificationCount={unreadCount}
        />
        <FeatureButton
          icon={PenSquare}
          title="Notes"
          description="Create and manage your notes"
          onClick={() => navigate('/notes')}
        />
        <FeatureButton
          icon={Users}
          title="Contacts"
          description="Manage your contacts"
          onClick={() => navigate('/contacts')}
        />
        <FeatureButton
          icon={Bookmark}
          title="Saved items"
          description="Access your saved content"
          onClick={() => navigate('/saved')}
        />
      </div>
      
      {/* Third row - AI Assistant only */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
        <FeatureButton
          icon={Bot}
          title="AI Assistant"
          description="Chat with AI voice agents"
          onClick={() => navigate('/ai-assistant')}
        />
      </div>
    </div>
  );
};
