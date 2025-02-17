
export type Message = {
  id: string;
  title: string | null;
  content: string | null;
  category: string;
  created_at: string | null;
  is_sent?: boolean | null;
  is_received?: boolean | null;
  is_selected?: boolean | null;
  error_code?: string | null;
  error_message?: string | null;
  delivery_attempts?: number;
  last_delivery_attempt?: string | null;
  status?: string;
  next_retry?: string | null;
  retryable?: boolean;
};
