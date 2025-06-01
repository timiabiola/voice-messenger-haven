interface PlaybackTimeProps {
  currentTime: number;
  duration: number;
  isLoading: boolean;
}

export const PlaybackTime = ({ currentTime, duration, isLoading }: PlaybackTimeProps) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>
  );
}; 