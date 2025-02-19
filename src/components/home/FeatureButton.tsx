
import { LucideIcon } from 'lucide-react';

interface FeatureButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
}

export const FeatureButton = ({ icon: Icon, title, description, onClick, badge }: FeatureButtonProps) => {
  return (
    <button 
      onClick={onClick}
      className="group p-4 md:p-6 bg-zinc-900/50 rounded-xl md:rounded-2xl border border-zinc-800 hover:border-amber-400/50 transition-all"
    >
      <div className="flex items-start space-x-4">
        <div className="p-2 md:p-3 bg-amber-400/10 rounded-lg md:rounded-xl">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-semibold text-amber-400 mb-1 md:mb-2">{title}</h3>
          <p className="text-sm md:text-base text-gray-400">{description}</p>
          {badge && (
            <span className="inline-block mt-2 text-xs md:text-sm text-amber-400">
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
