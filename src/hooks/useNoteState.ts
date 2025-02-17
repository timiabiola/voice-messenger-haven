
import { useState } from 'react';
import { Note } from '@/types/notes';

export function useNoteState() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const resetNoteState = () => {
    setIsEditing(false);
    setCurrentNote({ title: '', content: '' });
    setSelectedNote(null);
  };

  const startNewNote = () => {
    setIsEditing(true);
    setCurrentNote({ title: '', content: '' });
    setSelectedNote(null);
  };

  const startEditNote = (note: Note) => {
    setIsEditing(true);
    setCurrentNote({
      title: note.title,
      content: note.content
    });
    setSelectedNote(note);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(current => 
      current.includes(folderId)
        ? current.filter(id => id !== folderId)
        : [...current, folderId]
    );
  };

  return {
    isEditing,
    currentNote,
    selectedNote,
    activeFolder,
    expandedFolders,
    searchQuery,
    setSearchQuery,
    setActiveFolder,
    setSelectedNote,
    setCurrentNote, // Added this to the return object
    resetNoteState,
    startNewNote,
    startEditNote,
    toggleFolder
  };
}
