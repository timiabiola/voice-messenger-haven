import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

// Custom curved arrow icons matching the reference design
const SkipBackwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Curved arrow going counter-clockwise */}
    <path
      d="M12 20 C12 11, 19 4, 28 4"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrow head */}
    <path
      d="M12 20 L16 17 M12 20 L15 24"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* 10s text in center */}
    <text
      x="20"
      y="26"
      textAnchor="middle"
      fontSize="14"
      fontWeight="700"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      10s
    </text>
  </svg>
);

const SkipForwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Curved arrow going clockwise */}
    <path
      d="M28 20 C28 11, 21 4, 12 4"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrow head */}
    <path
      d="M28 20 L24 17 M28 20 L25 24"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* 10s text in center */}
    <text
      x="20"
      y="26"
      textAnchor="middle"
      fontSize="14"
      fontWeight="700"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      10s
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
          "relative h-12 w-12 sm:h-14 sm:w-14 p-0",
          "bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600",
          "border border-zinc-700/50 hover:border-amber-400/50",
          "group transition-all duration-200",
          "rounded-full shadow-md hover:shadow-lg",
          "flex items-center justify-center"
        )}
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <SkipBackwardIcon className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-300 group-hover:text-amber-400 transition-colors" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipForward}
        disabled={disabled}
        className={cn(
          "relative h-12 w-12 sm:h-14 sm:w-14 p-0",
          "bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600",
          "border border-zinc-700/50 hover:border-amber-400/50",
          "group transition-all duration-200",
          "rounded-full shadow-md hover:shadow-lg",
          "flex items-center justify-center"
        )}
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <SkipForwardIcon className="h-10 w-10 sm:h-12 sm:w-12 text-zinc-300 group-hover:text-amber-400 transition-colors" />
      </Button>
    </div>
  );
}