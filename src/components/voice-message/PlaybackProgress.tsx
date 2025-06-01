import { useRef, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlaybackProgressProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isLoading: boolean;
  isPlaying: boolean;
}

export const PlaybackProgress = ({
  currentTime,
  duration,
  onSeek,
  isLoading,
  isPlaying
}: PlaybackProgressProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTimeFromPosition = (clientX: number): { percentage: number; time: number } => {
    if (!progressRef.current) return { percentage: 0, time: 0 };
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const time = (x / rect.width) * duration;
    
    return {
      percentage: Math.max(0, Math.min(percentage, 100)),
      time: Math.max(0, Math.min(time, duration))
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0 || isMobile) return;

    const { percentage, time } = calculateTimeFromPosition(e.clientX);
    setHoverPosition(percentage);
    setHoverTime(formatTime(time));
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoverPosition(null);
      setHoverTime('');
    }
  };

  const handleInteractionStart = (clientX: number) => {
    if (!progressRef.current || duration === 0 || isLoading) return;
    
    setIsDragging(true);
    const { time } = calculateTimeFromPosition(clientX);
    onSeek(time);
  };

  const handleInteractionMove = (clientX: number) => {
    if (!isDragging || !progressRef.current || duration === 0) return;
    
    const { time } = calculateTimeFromPosition(clientX);
    onSeek(time);
  };

  const handleInteractionEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return; // Use touch events on mobile
    handleInteractionStart(e.clientX);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    handleInteractionStart(e.clientX);
  };

  const handleMouseUp = () => {
    if (isMobile) return;
    handleInteractionEnd();
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    handleInteractionStart(touch.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    handleInteractionMove(touch.clientX);
  };

  const handleTouchEnd = () => {
    handleInteractionEnd();
  };

  // Global mouse events for dragging
  useEffect(() => {
    if (!isDragging || isMobile) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleInteractionMove(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      handleInteractionEnd();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isMobile]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-1">
      <div 
        ref={progressRef}
        className={`
          relative w-full ${isMobile ? 'h-3' : 'h-2'} bg-gray-200 dark:bg-gray-700 rounded-full 
          ${!isLoading && duration > 0 ? 'cursor-pointer' : 'cursor-not-allowed'}
          transition-all ${!isMobile && 'hover:h-3'} group
          ${isDragging ? 'h-4' : ''}
        `}
        onClick={!isMobile ? handleClick : undefined}
        onMouseDown={!isMobile ? handleMouseDown : undefined}
        onMouseUp={!isMobile ? handleMouseUp : undefined}
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        onMouseLeave={!isMobile ? handleMouseLeave : undefined}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        role="progressbar"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
      >
        {/* Background track */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Buffered/loaded indicator - slightly lighter than background */}
          <div 
            className="absolute top-0 left-0 h-full bg-gray-300 dark:bg-gray-600 opacity-50"
            style={{ width: '100%' }}
          />
        </div>

        {/* Progress fill */}
        <div 
          className={`
            absolute top-0 left-0 h-full rounded-full transition-all z-10
            ${isLoading ? 'bg-gray-400 animate-pulse' : 'bg-blue-600'}
            ${isDragging ? 'transition-none' : 'transition-all'}
          `}
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Playhead indicator */}
        <div 
          className={`
            absolute top-1/2 -translate-y-1/2 ${isMobile ? 'w-4 h-4' : 'w-3 h-3'} bg-white border-2 
            border-blue-600 rounded-full shadow-sm transition-all z-20
            ${isPlaying || progressPercentage > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
            ${!isMobile && 'group-hover:scale-125'}
            ${isDragging ? 'scale-150' : ''}
          `}
          style={{ 
            left: `${progressPercentage}%`, 
            marginLeft: isMobile ? '-8px' : '-6px',
            transition: isDragging ? 'none' : 'all 150ms'
          }}
        />

        {/* Hover tooltip - desktop only */}
        {!isMobile && hoverPosition !== null && duration > 0 && !isDragging && (
          <div 
            className="absolute -top-8 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none z-30"
            style={{ left: `${hoverPosition}%` }}
          >
            {hoverTime}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 