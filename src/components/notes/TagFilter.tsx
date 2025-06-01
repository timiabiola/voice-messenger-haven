import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoteTag } from '@/types/notes';

interface TagFilterProps {
  tags: NoteTag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
}

export const TagFilter = ({
  tags,
  selectedTags,
  onToggleTag,
}: TagFilterProps) => {
  if (tags.length === 0) return null;

  return (
    <div className="p-4 border-t border-border">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Filter by Tags
      </h3>
      <ScrollArea className="h-32">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected ? tag.color : 'transparent',
                  borderColor: tag.color,
                  color: isSelected ? 'white' : tag.color,
                }}
                onClick={() => onToggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}; 