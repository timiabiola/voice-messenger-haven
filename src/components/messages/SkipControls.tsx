import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

// Custom icon components with improved design for better readability
const Skip10BackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background circle for better contrast */}
    <circle cx="20" cy="20" r="18" fill="currentColor" fillOpacity="0.05" />
    
    {/* Circular arrow path */}
    <path
      d="M20 8 L20 4 L14 10 L20 16 L20 12 C26 12 30 16 30 22 C30 28 26 32 20 32 C14 32 10 28 10 22"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    
    {/* "10" text with background for better readability */}
    <rect x="13" y="17" width="14" height="10" rx="2" fill="currentColor" fillOpacity="0.1" />
    <text
      x="20"
      y="24"
      textAnchor="middle"
      fontSize="14"
      fontWeight="900"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
      className="select-none"
    >
      10
    </text>
  </svg>
);

const Skip10ForwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background circle for better contrast */}
    <circle cx="20" cy="20" r="18" fill="currentColor" fillOpacity="0.05" />
    
    {/* Circular arrow path (mirrored) */}
    <path
      d="M20 8 L20 4 L26 10 L20 16 L20 12 C14 12 10 16 10 22 C10 28 14 32 20 32 C26 32 30 28 30 22"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    
    {/* "10" text with background for better readability */}
    <rect x="13" y="17" width="14" height="10" rx="2" fill="currentColor" fillOpacity="0.1" />
    <text
      x="20"
      y="24"
      textAnchor="middle"
      fontSize="14"
      fontWeight="900"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
      className="select-none"
    >
      10
    </text>
  </svg>
);

export function SkipControls({
  onSkipBackward,
  onSkipForward,
  disabled = false,
  className
}: SkipControlsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipBackward}
        disabled={disabled}
        className="h-12 sm:h-14 w-12 sm:w-14 p-0 group hover:bg-amber-400/10 hover:border-amber-400/30 border-2 border-zinc-800/50 transition-all duration-200 rounded-2xl hover:scale-105 active:scale-95 disabled:hover:scale-100"
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <Skip10BackIcon className="h-10 sm:h-12 w-10 sm:w-12 text-zinc-400 group-hover:text-amber-400 transition-colors" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipForward}
        disabled={disabled}
        className="h-12 sm:h-14 w-12 sm:w-14 p-0 group hover:bg-amber-400/10 hover:border-amber-400/30 border-2 border-zinc-800/50 transition-all duration-200 rounded-2xl hover:scale-105 active:scale-95 disabled:hover:scale-100"
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <Skip10ForwardIcon className="h-10 sm:h-12 w-10 sm:w-12 text-zinc-400 group-hover:text-amber-400 transition-colors" />
      </Button>
    </div>
  );
} 