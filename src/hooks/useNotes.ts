import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Note, Folder } from '@/types/notes';

export function useNotes(userId: string | null) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        const { data: foldersData, error: foldersError } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId)
          .order('name');

        if (foldersError) throw foldersError;
        setFolders(foldersData || []);

        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (notesError) throw notesError;
        // Cast the type to match our interface
        const typedNotes = (notesData || []).map(note => ({
          ...note,
          type: (note.type as 'text' | 'voice') || 'text'
        }));
        setNotes(typedNotes);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load notes and folders"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, toast]);

  const createFolder = async (folderName: string) => {
    if (!userId || !folderName) return null;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: folderName,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;
      setFolders(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Folder created successfully"
      });
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder"
      });
      return null;
    }
  };

  const createNote = async (title: string, content: string, folderId: string | null, audioUrl?: string, duration?: number) => {
    if (!userId || (!title && !content && !audioUrl)) return null;

    try {
      const noteData: any = {
        title: title || 'Untitled Note',
        content: content || '',
        folder_id: folderId,
        user_id: userId,
        type: audioUrl ? 'voice' : 'text'
      };

      if (audioUrl) {
        noteData.audio_url = audioUrl;
        noteData.duration = duration;
      }

      const { data, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();

      if (error) throw error;
      // Cast the type to match our interface
      const typedNote: Note = {
        ...data,
        type: (data.type as 'text' | 'voice') || 'text'
      };
      setNotes(prev => [typedNote, ...prev]);
      toast({
        title: "Success",
        description: "Note created successfully"
      });
      return typedNote;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create note"
      });
      return null;
    }
  };

  const updateNote = async (noteId: string, updates: { title?: string; content?: string; folder_id?: string | null; audio_url?: string; duration?: number }) => {
    if (!userId || !noteId) return null;

    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.audio_url !== undefined) {
        updateData.type = updates.audio_url ? 'voice' : 'text';
      }

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      // Cast the type to match our interface
      const typedNote: Note = {
        ...data,
        type: (data.type as 'text' | 'voice') || 'text'
      };
      setNotes(prev => prev.map(note => note.id === noteId ? typedNote : note));
      toast({
        title: "Success",
        description: "Note updated successfully"
      });
      return typedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update note"
      });
      return null;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note"
      });
      return false;
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      toast({
        title: "Success",
        description: "Folder deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete folder"
      });
      return false;
    }
  };

  return {
    notes,
    folders,
    isLoading,
    createFolder,
    createNote,
    updateNote,
    deleteNote,
    deleteFolder
  };
}
