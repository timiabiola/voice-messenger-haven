
export type Message = {
  id: string;
  title: string | null;
  content: string | null;
  category: string;
  created_at: string | null;
  is_sent?: boolean | null;
  is_received?: boolean | null;
  is_selected?: boolean | null;
};
