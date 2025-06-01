
import { LucideIcon } from 'lucide-react';
import { NotificationBadge } from '@/components/ui/NotificationBadge';

interface FeatureButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
  notificationCount?: number;
  showNotificationBadge?: boolean;
}

export const FeatureButton = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  badge, 
  notificationCount = 0,
  showNotificationBadge = false 
}: FeatureButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className="group p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-amber-400/50 transition-all w-full text-left active:scale-[0.98] touch-manipulation relative"
    >
      {showNotificationBadge && <NotificationBadge count={notificationCount} />}
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-amber-400/10 rounded-lg shrink-0">
          <Icon className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-amber-400 mb-1 truncate">{title}</h3>
          <p className="text-sm text-gray-400 line-clamp-2">{description}</p>
          {badge && !showNotificationBadge && (
            <span className="inline-block mt-2 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
