import { X } from 'lucide-react';
import { useMessageTags } from '@/hooks/useMessageTags';
import { Badge } from '@/components/ui/badge';

interface MessageTagsProps {
  savedItemId: string;
  className?: string;
}

export const MessageTags = ({ savedItemId, className = '' }: MessageTagsProps) => {
  const { messageTags, isLoading, removeTag, isRemoving } = useMessageTags(savedItemId);

  if (isLoading || !messageTags || messageTags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {messageTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="bg-amber-400/10 text-amber-400 border-amber-400/20 hover:bg-amber-400/20 transition-colors"
        >
          <span>{tag.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeTag({ savedItemId, tagId: tag.id });
            }}
            disabled={isRemoving}
            className="ml-1 hover:bg-amber-400/20 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${tag.name} tag`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}; 