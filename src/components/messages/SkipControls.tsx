import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

// Custom icons matching the original design - circular arrows with "10" in center
const SkipBackwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Circular arrow path going counter-clockwise, 3/4 of circle */}
    <path
      d="M4.5 12 A7.5 7.5 0 1 1 12 4.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrow head pointing left */}
    <path
      d="M4.5 12 L7 9.5 M4.5 12 L7 14.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* "10" text in center */}
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="11"
      fontWeight="800"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      10
    </text>
  </svg>
);

const SkipForwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Circular arrow path going clockwise, 3/4 of circle */}
    <path
      d="M19.5 12 A7.5 7.5 0 1 0 12 4.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrow head pointing right */}
    <path
      d="M19.5 12 L17 9.5 M19.5 12 L17 14.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* "10" text in center */}
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="11"
      fontWeight="800"
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
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipBackward}
        disabled={disabled}
        className={cn(
          "relative h-12 w-12 sm:h-14 sm:w-14 p-2",
          "bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600",
          "border border-zinc-700/50 hover:border-amber-400/50",
          "group transition-all duration-200",
          "rounded-full shadow-md hover:shadow-lg",
          "flex items-center justify-center"
        )}
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <SkipBackwardIcon className="h-full w-full text-zinc-300 group-hover:text-amber-400 transition-colors" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipForward}
        disabled={disabled}
        className={cn(
          "relative h-12 w-12 sm:h-14 sm:w-14 p-2",
          "bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600",
          "border border-zinc-700/50 hover:border-amber-400/50",
          "group transition-all duration-200",
          "rounded-full shadow-md hover:shadow-lg",
          "flex items-center justify-center"
        )}
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <SkipForwardIcon className="h-full w-full text-zinc-300 group-hover:text-amber-400 transition-colors" />
      </Button>
    </div>
  );
}