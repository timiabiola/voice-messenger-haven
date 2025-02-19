
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import EmptyState from '@/components/layout/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft,
  Play,
  Pause,
  Share2,
  Bookmark,
  Search,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';

interface VoiceMessage {
  id: string;
  title: string;
  subject: string;
  audio_url: string;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    email: string;
  };
  is_urgent: boolean;
  is_private: boolean;
}

const MessageCard = ({ message }: { message: VoiceMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio] = useState(new Audio(message.audio_url));
  const waveform = Array(40).fill(0).map(() => Math.random() * 100);

  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime / audio.duration);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio]);

  const togglePlayPause = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-gray-100 font-medium">
            {message.sender.first_name} {message.sender.last_name}
          </h3>
          <p className="text-gray-400 text-sm">
            {new Date(message.created_at).toLocaleString()}
          </p>
        </div>
        <button className="text-gray-400 hover:text-gray-300">
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Waveform Visualization */}
      <div className="mb-8">
        <div className="flex items-center h-24 gap-px">
          {waveform.map((height, i) => (
            <div key={i} className="flex-1 h-full flex items-center">
              <div 
                className={`w-full rounded-full transition-all duration-300 ${
                  i / waveform.length < currentTime 
                    ? 'bg-blue-500/80' 
                    : 'bg-gray-600/50'
                }`}
                style={{ 
                  height: `${height}%`,
                  transform: `scaleY(${isPlaying ? '1' : '0.95'})`,
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-6">
        {/* Time Indicators */}
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatTime(currentTime * duration)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1 bg-gray-700/50 rounded-full">
          <div 
            className="absolute h-full bg-blue-500/80 rounded-full"
            style={{ width: `${currentTime * 100}%` }}
          />
          <div 
            className="absolute h-3 w-3 bg-blue-500 rounded-full shadow-lg -mt-1"
            style={{ left: `${currentTime * 100}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4">
          <button 
            className="w-16 h-16 rounded-full bg-blue-500/80 hover:bg-blue-500 flex items-center justify-center transition-all duration-300 transform hover:scale-105"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-8 pt-4">
          <button className="group flex flex-col items-center">
            <div className="p-2 rounded-full bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors">
              <Share2 className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Forward</span>
          </button>
          <button className="group flex flex-col items-center">
            <div className="p-2 rounded-full bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors">
              <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Reply</span>
          </button>
          <button className="group flex flex-col items-center">
            <div className="p-2 rounded-full bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors">
              <Bookmark className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
            </div>
            <span className="text-xs text-gray-500 mt-1">Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Inbox = () => {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: recipientData, error: recipientError } = await supabase
        .from('voice_message_recipients')
        .select('voice_message_id')
        .eq('recipient_id', session.user.id);

      if (recipientError) throw recipientError;

      if (!recipientData?.length) {
        setMessages([]);
        return;
      }

      const { data: messageData, error: messageError } = await supabase
        .from('voice_messages')
        .select(`
          id,
          title,
          subject,
          audio_url,
          created_at,
          is_urgent,
          is_private,
          sender:profiles (
            first_name,
            last_name,
            email
          )
        `)
        .in('id', recipientData.map(r => r.voice_message_id))
        .order('created_at', { ascending: false });

      if (messageError) throw messageError;

      setMessages(messageData || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (messages.length === 0) {
    return (
      <AppLayout>
        <EmptyState />
      </AppLayout>
    );
  }

  const filteredMessages = messages.filter(message => 
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${message.sender.first_name} ${message.sender.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Top Search Bar */}
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 z-10">
          <div className="max-w-[90vw] lg:max-w-[800px] mx-auto p-4">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-gray-300"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back</span>
              </Button>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search voice messages..."
                className="w-full bg-gray-800/50 text-gray-100 placeholder-gray-500 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[90vw] lg:max-w-[800px] mx-auto p-4">
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Inbox;
