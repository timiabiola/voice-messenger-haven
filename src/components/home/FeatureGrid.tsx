
import { Button } from '@/components/ui/button';
import { MessageSquare, Pencil, Users, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
    <div className="grid grid-cols-1 gap-4">
      {features.map((feature) => (
        <button
          key={feature.id}
          onClick={() => navigate(feature.path)}
          className={`w-full p-6 rounded-2xl transition-all duration-200 relative
            ${feature.primary 
              ? 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:shadow-md' 
              : 'bg-card hover:bg-card/80 text-card-foreground border border-border/50 hover:border-primary/30'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${feature.primary ? 'bg-primary-foreground/10' : 'bg-primary/10'}`}>
              {feature.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-xl font-semibold mb-1">{feature.label}</h3>
              <p className="text-sm opacity-80">{feature.description}</p>
            </div>
            {feature.badge > 0 && <NotificationBadge count={feature.badge} />}
          </div>
        </button>
      ))}
    </div>
  );
}
