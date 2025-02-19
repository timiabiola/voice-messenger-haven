
import { MessageSquare, PenSquare, Users, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGridProps {
  unreadCount: number;
}

export const FeatureGrid = ({ unreadCount }: FeatureGridProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-0">
      {/* Messages */}
      <button 
        onClick={() => navigate('/inbox-0')}
        className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
      >
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-amber-400/10 rounded-xl group-hover:bg-amber-400/20 transition-colors">
            <MessageSquare className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Messages</h3>
            <p className="text-sm text-zinc-400">View your messages</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="text-sm text-amber-400">{unreadCount} unread messages</span>
        )}
      </button>

      {/* Notes */}
      <button 
        onClick={() => navigate('/notes')}
        className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-400/10 rounded-xl group-hover:bg-amber-400/20 transition-colors">
            <PenSquare className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Notes</h3>
            <p className="text-sm text-zinc-400">Create and manage your notes</p>
          </div>
        </div>
      </button>

      {/* Contacts */}
      <button 
        onClick={() => navigate('/contacts')}
        className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-400/10 rounded-xl group-hover:bg-amber-400/20 transition-colors">
            <Users className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Contacts</h3>
            <p className="text-sm text-zinc-400">Manage your contacts</p>
          </div>
        </div>
      </button>

      {/* Saved Items */}
      <button 
        onClick={() => navigate('/saved')}
        className="group p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-400/10 rounded-xl group-hover:bg-amber-400/20 transition-colors">
            <Bookmark className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Saved items</h3>
            <p className="text-sm text-zinc-400">Access your saved content</p>
          </div>
        </div>
      </button>
    </div>
  );
};
