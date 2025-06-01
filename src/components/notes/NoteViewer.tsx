import { useState, useEffect } from 'react';
import { X, Pencil, Trash2, FolderOpen, MoreVertical, ArrowLeft, Mic, Plus } from 'lucide-react';
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
  onNewNote?: () => void;
};

export default function NoteViewer({
  note,
  folders,
  userId,
  onClose,
  onEdit,
  onDelete,
  onMove,
  onNewNote,
}: NoteViewerProps) {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [noteTags, setNoteTags] = useState<NoteTag[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    tags,
    createTag,
    addTagToNote,
    removeTagFromNote,
    getNoteTags
  } = useNoteTags(userId);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + E to edit
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        onEdit();
      }
      // Escape to close
      else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Delete key to delete (with confirmation)
      else if (e.key === 'Delete' && e.shiftKey) {
        e.preventDefault();
        onDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEdit, onClose, onDelete, isMobile]);

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
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start gap-2">
            {/* Mobile back button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            
            <div className="flex-1 min-w-0">
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
            {!isMobile && (
              <div className="flex items-center gap-2">
                {onNewNote && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={onNewNote}
                    className="gap-2"
                    title="Create new note (Ctrl+N)"
                  >
                    <Plus className="w-4 h-4" />
                    New Note
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onEdit}
                  className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Edit note (Ctrl+E)"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
                {onMove && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowMoveDialog(true)}
                    className="gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="Move to folder"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Move
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDelete}
                  className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="hover:bg-accent transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Mobile action buttons - more visible */}
            {isMobile && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  className="text-primary"
                >
                  <Pencil className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onMove && (
                      <>
                        <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Move to Folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Tags - make more mobile friendly */}
          {(!isMobile || (noteTags.length > 0 || tags.length > 0)) && (
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
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Voice note indicator for mobile */}
          {isMobile && note.audio_url && !note.content && (
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Mic className="w-5 h-5" />
              <span>Voice Note</span>
            </div>
          )}
          
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
              {note.content || (note.audio_url && !isMobile ? 'Voice note' : 'No content')}
            </div>
          </div>
        </div>

        {/* Mobile floating action button for edit */}
        {isMobile && (
          <div className="fixed bottom-20 right-4 z-10">
            <Button
              size="lg"
              onClick={onEdit}
              className="rounded-full w-14 h-14 shadow-lg"
            >
              <Pencil className="w-5 h-5" />
            </Button>
          </div>
        )}
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

