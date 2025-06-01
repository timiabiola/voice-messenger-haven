interface AudioWaveformProps {
  isPlaying: boolean;
  className?: string;
}

export const AudioWaveform = ({ isPlaying, className = '' }: AudioWaveformProps) => {
  const bars = [
    { height: 'h-3', delay: 'delay-0' },
    { height: 'h-5', delay: 'delay-75' },
    { height: 'h-4', delay: 'delay-150' },
    { height: 'h-6', delay: 'delay-300' },
    { height: 'h-4', delay: 'delay-450' }
  ];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {bars.map((bar, index) => (
        <div
          key={index}
          className={`
            w-0.5 bg-current transition-all duration-300
            ${isPlaying ? `${bar.height} animate-pulse ${bar.delay}` : 'h-2'}
          `}
        />
      ))}
    </div>
  );
}; 