
export type Message = {
  id: string;
  title: string | null;
  content: string | null;
  category: string;
  created_at: string | null;
  is_sent?: boolean | null;
  is_received?: boolean | null;
  is_selected?: boolean | null;
  status?: string | null;
  error_message?: string | null;
  twilio_sid?: string | null;
  delivery_attempts?: number;
  next_retry?: string | null;
  retryable?: boolean;
};
