import { useRecentSavedMessages } from '@/hooks/useSaveMessage';
import { SavedMessageCard } from './SavedMessageCard';
import { Bookmark, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RecentSavedMessages = () => {
  const navigate = useNavigate();
  const { data: recentMessages, isLoading } = useRecentSavedMessages(3);

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-zinc-800/50 rounded-lg" />
          <div className="h-20 bg-zinc-800/50 rounded-lg" />
          <div className="h-20 bg-zinc-800/50 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!recentMessages || recentMessages.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-semibold text-amber-400">Recent Saved Messages</h2>
        </div>
        <button
          onClick={() => navigate('/saved')}
          className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {recentMessages.map((savedItem) => (
          <SavedMessageCard key={savedItem.id} savedItem={savedItem} />
        ))}
      </div>
    </div>
  );
}; 