import { useState, useEffect } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NoteTag } from '@/types/notes';

interface TagSelectorProps {
  noteId: string;
  tags: NoteTag[];
  selectedTags: NoteTag[];
  onAddTag: (noteId: string, tagId: string) => Promise<boolean>;
  onRemoveTag: (noteId: string, tagId: string) => Promise<boolean>;
  onCreateTag: (name: string, color?: string) => Promise<NoteTag | null>;
}

export const TagSelector = ({
  noteId,
  tags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: TagSelectorProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#808080');

  const availableTags = tags.filter(
    tag => !selectedTags.some(st => st.id === tag.id)
  );

  const handleAddTag = async (tagId: string) => {
    await onAddTag(noteId, tagId);
  };

  const handleRemoveTag = async (tagId: string) => {
    await onRemoveTag(noteId, tagId);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const newTag = await onCreateTag(newTagName, selectedColor);
    if (newTag) {
      await onAddTag(noteId, newTag.id);
      setNewTagName('');
      setIsCreating(false);
    }
  };

  const colors = [
    '#808080', // gray
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
          style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
        >
          <Tag className="w-3 h-3" style={{ color: tag.color }} />
          <span>{tag.name}</span>
          <button
            onClick={() => handleRemoveTag(tag.id)}
            className="ml-1 rounded-full hover:bg-accent/20"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7">
            <Plus className="w-3 h-3 mr-1" />
            Add Tag
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {availableTags.length > 0 && (
            <>
              {availableTags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => handleAddTag(tag.id)}
                  className="flex items-center gap-2"
                >
                  <Tag 
                    className="w-3 h-3" 
                    style={{ color: tag.color }} 
                  />
                  {tag.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {!isCreating ? (
            <DropdownMenuItem
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Create New Tag
            </DropdownMenuItem>
          ) : (
            <div className="p-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                placeholder="Tag name"
                className="mb-2"
                autoFocus
              />
              <div className="flex gap-1 mb-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedColor === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleCreateTag}
                  className="flex-1"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewTagName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}; 