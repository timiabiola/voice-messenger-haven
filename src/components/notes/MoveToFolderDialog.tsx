import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Note, Folder } from '@/types/notes';

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note;
  folders: Folder[];
  onMove: (noteId: string, folderId: string | null) => void;
}

export const MoveToFolderDialog = ({
  open,
  onOpenChange,
  note,
  folders,
  onMove,
}: MoveToFolderDialogProps) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    note.folder_id
  );

  const handleMove = () => {
    if (selectedFolderId !== note.folder_id) {
      onMove(note.id, selectedFolderId);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Move Note to Folder
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Select a folder to move "{note.title}" to:
          </p>
          
          <Select
            value={selectedFolderId || 'none'}
            onValueChange={(value) => 
              setSelectedFolderId(value === 'none' ? null : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">No folder</span>
              </SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={selectedFolderId === note.folder_id}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 