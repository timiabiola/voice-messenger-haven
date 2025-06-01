export interface Note {
  id: string;
  title: string;
  content: string;
  type?: 'text' | 'voice';
  audio_url?: string;
  duration?: number;
  transcription?: string;
  folder_id: string | null;
  user_id?: string;
  created_at: string;
  updated_at: string;
  tags?: NoteTag[];
}

export interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NoteTag {
  id: string;
  name: string;
  color?: string;
  user_id?: string;
  created_at?: string;
}

export interface NoteTagRelation {
  note_id: string;
  tag_id: string;
  created_at: string;
}
