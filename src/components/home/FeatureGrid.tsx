
import { Button } from '@/components/ui/button';
import { MessageSquare, Pencil, Users, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Feature {
  id: string;
  label: string;
  description: string;
  icon: JSX.Element;
  badge?: number;
  primary?: boolean;
  path: string;
}

interface FeatureGridProps {
  unreadCount: number;
}

export const FeatureGrid = ({ unreadCount }: FeatureGridProps) => {
  const navigate = useNavigate();

  const features: Feature[] = [
    {
      id: 'messages',
      label: 'Messages',
      description: 'View your messages',
      icon: <MessageSquare className="w-6 h-6" />,
      badge: unreadCount,
      primary: true,
      path: '/inbox-0'
    },
    {
      id: 'notes',
      label: 'Notes',
      description: 'Create and manage your notes',
      icon: <Pencil className="w-6 h-6" />,
      path: '/notes'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      description: 'Manage your contacts',
      icon: <Users className="w-6 h-6" />,
      path: '/contacts'
    },
    {
      id: 'saved',
      label: 'Saved items',
      description: 'Access your saved content',
      icon: <Bookmark className="w-6 h-6" />,
      path: '/saved'
    }
  ];

  const NotificationBadge = ({ count }: { count: number }) => {
    if (!count) return null;
    return (
      <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs 
        rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
        {count > 99 ? '99+' : count}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full mx-auto">
      {features.map((feature) => (
        <button
          key={feature.id}
          onClick={() => navigate(feature.path)}
          className={`w-full p-5 rounded-xl border transition-colors text-left relative
            ${feature.primary 
              ? 'border-primary bg-primary/5 hover:bg-primary/10 active:bg-primary/15' 
              : 'border-border bg-card hover:border-primary active:bg-accent/5'}`}
        >
          <div className="flex items-center space-x-4">
            <span className="text-2xl relative">
              {feature.icon}
              {feature.badge > 0 && <NotificationBadge count={feature.badge} />}
            </span>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-primary mb-1">{feature.label}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
