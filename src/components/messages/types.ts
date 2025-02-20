
export interface Message {
  id: string;
  title: string;
  subject: string;
  audio_url: string;
  created_at: string;
  is_urgent: boolean;
  is_private: boolean;
  sender: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface MessageCardProps {
  message: Message;
}
