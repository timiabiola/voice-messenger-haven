import * as React from 'react';
import { cn } from '@/lib/utils';
import { SkipControls } from './SkipControls';

interface PlaybackControlsProps {
  currentTime: number;
  duration: number;
  playbackRate: number;
  onSeek: (time: number) => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onSpeedChange: (speed: number) => void;
  isLoading?: boolean;
}

const speedOptions = [1, 1.25, 1.5, 1.75, 2];

export const PlaybackControls = ({
  currentTime,
  duration,
  playbackRate,
  onSeek,
  onSkipBackward,
  onSkipForward,
  onSpeedChange,
  isLoading = false
}: PlaybackControlsProps) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const progressRef = React.useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTimeFromPosition = (clientX: number) => {
    if (!progressRef.current || duration === 0) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = x / rect.width;
    return Math.max(0, Math.min(percentage * duration, duration));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isLoading && duration > 0) {
      const time = calculateTimeFromPosition(e.clientX);
      onSeek(time);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isLoading && duration > 0) {
      setIsDragging(true);
      const time = calculateTimeFromPosition(e.clientX);
      onSeek(time);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !isLoading && duration > 0) {
      const time = calculateTimeFromPosition(e.clientX);
      onSeek(time);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Progress bar */}
      <div className="space-y-2">
        <div 
          ref={progressRef}
          className="relative h-1.5 bg-zinc-800 rounded-full cursor-pointer overflow-hidden group"
          onClick={handleClick}
          onMouseDown={handleMouseDown}
        >
          <div 
            className="absolute h-full bg-amber-400 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progressPercentage}%`, marginLeft: '-6px' }}
          />
        </div>
        
        {/* Time display */}
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Skip controls */}
        <SkipControls
          onSkipBackward={onSkipBackward}
          onSkipForward={onSkipForward}
          disabled={isLoading}
        />

        {/* Speed controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-800/50 rounded-full p-0.5 sm:p-1">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              disabled={isLoading}
              className={cn(
                "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200",
                playbackRate === speed
                  ? "bg-amber-400 text-black"
                  : "text-zinc-400 hover:text-amber-400 hover:bg-zinc-800"
              )}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};