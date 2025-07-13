import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

interface PlaybackSpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
  className?: string;
}

const SPEED_OPTIONS = [
  { value: 1, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 1.75, label: "1.75x" },
  { value: 2, label: "2x" }
];

export function PlaybackSpeedControl({
  currentSpeed,
  onSpeedChange,
  disabled = false,
  className
}: PlaybackSpeedControlProps) {
  return (
    <ToggleGroup
      type="single"
      value={currentSpeed.toString()}
      onValueChange={(value) => value && onSpeedChange(parseFloat(value))}
      disabled={disabled}
      className={cn("gap-0", className)}
    >
      {SPEED_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value.toString()}
          aria-label={`Playback speed ${option.label}`}
          className={cn(
            "text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9",
            "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
} 