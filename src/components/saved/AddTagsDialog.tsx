import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TagsInput } from '@/components/TagsInput';
import { useMessageTags } from '@/hooks/useMessageTags';

interface AddTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedItemId: string;
  existingTags?: string[];
}

export const AddTagsDialog = ({
  open,
  onOpenChange,
  savedItemId,
  existingTags = [],
}: AddTagsDialogProps) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(existingTags);
  const { addTagsByName, isAdding } = useMessageTags(savedItemId);

  const handleSave = () => {
    const newTags = selectedTags.filter(tag => !existingTags.includes(tag));
    if (newTags.length > 0) {
      addTagsByName(
        { savedItemId, tagNames: newTags },
        {
          onSuccess: () => {
            onOpenChange(false);
            setSelectedTags([]);
          },
        }
      );
    } else {
      onOpenChange(false);
    }
  };

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tags</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <TagsInput
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            onTagRemove={handleTagRemove}
          />
          <p className="text-sm text-gray-500 mt-2">
            Type to search existing tags or create new ones
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isAdding || selectedTags.length === 0}
            className="bg-amber-400 hover:bg-amber-300 text-black"
          >
            {isAdding ? 'Adding...' : 'Add Tags'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 