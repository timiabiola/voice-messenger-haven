import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

// Custom icon components with better design
const Skip10BackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Circular arrow path */}
    <path
      d="M16 6 L16 2 L10 8 L16 14 L16 10 C21 10 25 14 25 19 C25 24 21 28 16 28 C11 28 7 24 7 19"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* "10" text - positioned in center */}
    <text
      x="16"
      y="20"
      textAnchor="middle"
      fontSize="10"
      fontWeight="700"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      10
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
    {/* Circular arrow path (mirrored) */}
    <path
      d="M16 6 L16 2 L22 8 L16 14 L16 10 C11 10 7 14 7 19 C7 24 11 28 16 28 C21 28 25 24 25 19"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* "10" text - positioned in center */}
    <text
      x="16"
      y="20"
      textAnchor="middle"
      fontSize="10"
      fontWeight="700"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
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
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipBackward}
        disabled={disabled}
        className="h-9 sm:h-10 w-9 sm:w-10 p-0 group hover:bg-muted/50"
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <Skip10BackIcon className="h-6 sm:h-7 w-6 sm:w-7" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipForward}
        disabled={disabled}
        className="h-9 sm:h-10 w-9 sm:w-10 p-0 group hover:bg-muted/50"
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <Skip10ForwardIcon className="h-6 sm:h-7 w-6 sm:w-7" />
      </Button>
    </div>
  );
} 