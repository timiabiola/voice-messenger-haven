import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw } from "lucide-react";
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
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipBackward}
        disabled={disabled}
        className="h-8 sm:h-9 px-2 sm:px-3 group"
        aria-label="Skip backward 10 seconds"
      >
        <RotateCcw className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1" />
        <span className="text-xs sm:text-sm">10s</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipForward}
        disabled={disabled}
        className="h-8 sm:h-9 px-2 sm:px-3 group"
        aria-label="Skip forward 10 seconds"
      >
        <span className="text-xs sm:text-sm">10s</span>
        <RotateCw className="h-3.5 sm:h-4 w-3.5 sm:w-4 ml-1" />
      </Button>
    </div>
  );
} 