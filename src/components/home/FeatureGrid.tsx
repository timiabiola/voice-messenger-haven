
import { MessageSquare, PenSquare, Users, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FeatureButton } from './FeatureButton';

interface FeatureGridProps {
  unreadCount: number;
}

export const FeatureGrid = ({ unreadCount }: FeatureGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 w-full">
      <FeatureButton
        icon={MessageSquare}
        title="Messages"
        description="View your messages"
        onClick={() => navigate('/inbox-0')}
        badge={unreadCount > 0 ? `${unreadCount} unread` : undefined}
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
  );
};
