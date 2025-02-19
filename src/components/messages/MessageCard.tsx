
import { useState, useEffect } from 'react';
import { Play, Pause, Share2, Bookmark, ChevronDown, MessageCircle } from 'lucide-react';

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

export const MessageCard = ({ message }: { message: VoiceMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [audio] = useState(() => new Audio(message.audio_url));
  const waveform = Array(40).fill(0).map(() => Math.random() * 100);

  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
        setAudioReady(true);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    audio.preload = 'metadata';

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  const togglePlayPause = () => {
    if (!audioReady) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) : 0;

  return (
    <div className="relative bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 mb-4">
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

      <div className="mb-8">
        <div className="flex items-center h-24 gap-px">
          {waveform.map((height, i) => (
            <div key={i} className="flex-1 h-full flex items-center">
              <div 
                className={`w-full rounded-full transition-all duration-300 ${
                  i / waveform.length < progress 
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

      <div className="space-y-6">
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="relative h-1 bg-gray-700/50 rounded-full">
          <div 
            className="absolute h-full bg-blue-500/80 rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
          <div 
            className="absolute h-3 w-3 bg-blue-500 rounded-full shadow-lg -mt-1"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-4">
          <button 
            className={`w-16 h-16 rounded-full ${
              audioReady 
                ? 'bg-blue-500/80 hover:bg-blue-500 cursor-pointer' 
                : 'bg-gray-600/50 cursor-not-allowed'
            } flex items-center justify-center transition-all duration-300 transform hover:scale-105`}
            onClick={togglePlayPause}
            disabled={!audioReady}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>

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
