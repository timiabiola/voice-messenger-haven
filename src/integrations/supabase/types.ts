// Database types placeholder
export type Database = any;

// Forum types
export interface ForumBoard {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  content: string;
  is_edited: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  board?: ForumBoard;
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export interface ForumPostStats {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  reply_count: number;
  last_reply_at: string | null;
}
