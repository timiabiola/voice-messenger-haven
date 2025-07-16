import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

// Custom icon components with maximum legibility - text-first design
const Skip10BackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Simple left arrow */}
    <path
      d="M12 16 L6 16 M6 16 L10 12 M6 16 L10 20"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Large "10s" text */}
    <text
      x="19"
      y="20"
      textAnchor="middle"
      fontSize="13"
      fontWeight="800"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
      className="select-none"
    >
      10s
    </text>
  </svg>
);

const Skip10ForwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Large "10s" text */}
    <text
      x="13"
      y="20"
      textAnchor="middle"
      fontSize="13"
      fontWeight="800"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
      className="select-none"
    >
      10s
    </text>
    
    {/* Simple right arrow */}
    <path
      d="M20 16 L26 16 M26 16 L22 12 M26 16 L22 20"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function SkipControls({
  onSkipBackward,
  onSkipForward,
  disabled = false,
  className
}: SkipControlsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipBackward}
        disabled={disabled}
        className="h-9 w-12 p-0.5 group hover:bg-amber-400/15 active:bg-amber-400/25 transition-all duration-150 rounded-md"
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <Skip10BackIcon className="h-full w-full text-zinc-300 group-hover:text-amber-400 transition-colors" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipForward}
        disabled={disabled}
        className="h-9 w-12 p-0.5 group hover:bg-amber-400/15 active:bg-amber-400/25 transition-all duration-150 rounded-md"
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <Skip10ForwardIcon className="h-full w-full text-zinc-300 group-hover:text-amber-400 transition-colors" />
      </Button>
    </div>
  );
} 