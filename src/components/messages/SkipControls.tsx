import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
          "relative h-12 w-14 sm:h-14 sm:w-16 p-0",
          "bg-zinc-800/50 hover:bg-zinc-800 active:bg-zinc-700",
          "border border-zinc-700/30 hover:border-zinc-600",
          "group transition-all duration-200",
          "rounded-lg shadow-sm hover:shadow-md",
          "flex flex-col items-center justify-center gap-0.5"
        )}
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <span className="text-xl font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors leading-none">
          ◀◀
        </span>
        <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
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
          "flex flex-col items-center justify-center gap-0.5"
        )}
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <span className="text-xl font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors leading-none">
          ▶▶
        </span>
        <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
          10s
        </span>
      </Button>
    </div>
  );
}