
export interface VoiceMessage {
  id: string;
  title: string;
  subject: string;
  audio_url: string;
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  is_urgent: boolean;
  is_private: boolean;
}
