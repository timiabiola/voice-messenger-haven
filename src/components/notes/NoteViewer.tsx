import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, FolderOpen, MoreVertical, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Note, Folder, NoteTag } from '@/types/notes';
import { MoveToFolderDialog } from './MoveToFolderDialog';
import { TagSelector } from './TagSelector';
import { useNoteTags } from '@/hooks/useNoteTags';
import { VoiceRecorder } from './VoiceRecorder';

type NoteViewerProps = {
  note: Note;
  folders: Folder[];
  userId: string | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove?: (noteId: string, folderId: string | null) => void;
};

export default function NoteViewer({
  note,
  folders,
  userId,
  onClose,
  onEdit,
  onDelete,
  onMove,
}: NoteViewerProps) {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [noteTags, setNoteTags] = useState<NoteTag[]>([]);
  
  const {
    tags,
    createTag,
    addTagToNote,
    removeTagFromNote,
    getNoteTags
  } = useNoteTags(userId);

  useEffect(() => {
    const loadNoteTags = async () => {
      const tags = await getNoteTags(note.id);
      setNoteTags(tags);
    };
    loadNoteTags();
  }, [note.id, getNoteTags]);

  const handleAddTag = async (noteId: string, tagId: string) => {
    const success = await addTagToNote(noteId, tagId);
    if (success) {
      const updatedTags = await getNoteTags(noteId);
      setNoteTags(updatedTags);
    }
    return success;
  };

  const handleRemoveTag = async (noteId: string, tagId: string) => {
    const success = await removeTagFromNote(noteId, tagId);
    if (success) {
      const updatedTags = await getNoteTags(noteId);
      setNoteTags(updatedTags);
    }
    return success;
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              {/* Mobile back button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="md:hidden mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <h2 className="text-xl md:text-2xl font-semibold text-foreground truncate">
                {note.title || 'Untitled Note'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{new Date(note.created_at).toLocaleString()}</span>
                <span className="text-xs bg-accent/10 px-2 py-1 rounded">
                  {folders.find(f => f.id === note.folder_id)?.name || 'No folder'}
                </span>
              </div>
            </div>
            
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {onMove && (
                    <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Move to Folder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile action menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {onMove && (
                    <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Move to Folder
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-3">
            <TagSelector
              noteId={note.id}
              tags={tags}
              selectedTags={noteTags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onCreateTag={createTag}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {note.audio_url && (
            <div className="mb-4">
              <VoiceRecorder
                existingAudioUrl={note.audio_url}
                existingDuration={note.duration}
                onRecordingComplete={() => {}}
              />
            </div>
          )}
          
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-foreground">
              {note.content || (note.audio_url ? 'Voice note' : 'No content')}
            </div>
          </div>
        </div>
      </div>

      {onMove && (
        <MoveToFolderDialog
          open={showMoveDialog}
          onOpenChange={setShowMoveDialog}
          note={note}
          folders={folders}
          onMove={(noteId, folderId) => {
            onMove(noteId, folderId);
            setShowMoveDialog(false);
          }}
        />
      )}
    </>
  );
}
