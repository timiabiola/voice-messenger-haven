import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SkipBack, SkipForward } from "lucide-react";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

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
          "flex items-center justify-center gap-1"
        )}
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <SkipBack 
          className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-300 group-hover:text-amber-400 transition-colors" 
          strokeWidth={2.5}
        />
        <span className="text-xs sm:text-sm font-bold text-zinc-300 group-hover:text-amber-400 transition-colors">
          10
        </span>
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
          "flex items-center justify-center gap-1"
        )}
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <span className="text-xs sm:text-sm font-bold text-zinc-300 group-hover:text-amber-400 transition-colors">
          10
        </span>
        <SkipForward 
          className="h-6 w-6 sm:h-7 sm:w-7 text-zinc-300 group-hover:text-amber-400 transition-colors" 
          strokeWidth={2.5}
        />
      </Button>
    </div>
  );
}