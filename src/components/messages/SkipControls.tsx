import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

// Custom double triangle icons
const Skip10BackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 40 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Double triangles pointing left */}
    <path
      d="M14 6 L6 12 L14 18 M22 6 L14 12 L22 18"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    
    {/* "10s" text */}
    <text
      x="30"
      y="16"
      textAnchor="middle"
      fontSize="13"
      fontWeight="700"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      10s
    </text>
  </svg>
);

const Skip10ForwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 40 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* "10s" text */}
    <text
      x="10"
      y="16"
      textAnchor="middle"
      fontSize="13"
      fontWeight="700"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      10s
    </text>
    
    {/* Double triangles pointing right */}
    <path
      d="M18 6 L26 12 L18 18 M26 6 L34 12 L26 18"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
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
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipBackward}
        disabled={disabled}
        className={cn(
          "relative h-12 w-16 sm:h-14 sm:w-20 p-0",
          "bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600",
          "border border-zinc-700/50 hover:border-amber-400/50",
          "group transition-all duration-200",
          "rounded-lg shadow-md hover:shadow-lg",
          "flex items-center justify-center"
        )}
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
        className={cn(
          "relative h-12 w-16 sm:h-14 sm:w-20 p-0",
          "bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600",
          "border border-zinc-700/50 hover:border-amber-400/50",
          "group transition-all duration-200",
          "rounded-lg shadow-md hover:shadow-lg",
          "flex items-center justify-center"
        )}
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <Skip10ForwardIcon className="h-full w-full text-zinc-300 group-hover:text-amber-400 transition-colors" />
      </Button>
    </div>
  );
}