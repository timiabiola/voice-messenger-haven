import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

// Simple SVG icons with double triangles
const SkipBackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* First triangle */}
    <path d="M11 7 L11 17 L5 12 Z" />
    {/* Second triangle */}
    <path d="M19 7 L19 17 L13 12 Z" />
  </svg>
);

const SkipForwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* First triangle */}
    <path d="M5 7 L5 17 L11 12 Z" />
    {/* Second triangle */}
    <path d="M13 7 L13 17 L19 12 Z" />
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
          "relative h-12 w-14 sm:h-14 sm:w-16 p-0",
          "bg-zinc-800/50 hover:bg-zinc-800 active:bg-zinc-700",
          "border border-zinc-700/30 hover:border-zinc-600",
          "group transition-all duration-200",
          "rounded-lg shadow-sm hover:shadow-md",
          "flex flex-col items-center justify-center gap-1"
        )}
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <SkipBackIcon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-200 transition-colors pointer-events-none" />
        <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors pointer-events-none">
          10s
        </span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipForward}
        disabled={disabled}
        className={cn(
          "relative h-12 w-14 sm:h-14 sm:w-16 p-0",
          "bg-zinc-800/50 hover:bg-zinc-800 active:bg-zinc-700",
          "border border-zinc-700/30 hover:border-zinc-600",
          "group transition-all duration-200",
          "rounded-lg shadow-sm hover:shadow-md",
          "flex flex-col items-center justify-center gap-1"
        )}
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <SkipForwardIcon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-200 transition-colors pointer-events-none" />
        <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors pointer-events-none">
          10s
        </span>
      </Button>
    </div>
  );
}