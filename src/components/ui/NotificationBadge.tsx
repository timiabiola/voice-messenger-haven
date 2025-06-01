
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge = ({ count, className }: NotificationBadgeProps) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <div
      className={cn(
        "absolute -top-2 -left-2 bg-red-500 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center z-10 px-1",
        className
      )}
      aria-label={`${count} unread messages`}
    >
      {displayCount}
    </div>
  );
};
