import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SkipControlsProps {
  onSkipBackward: () => void;
  onSkipForward: () => void;
  disabled?: boolean;
  className?: string;
}

// Clean, professional skip icons with filled triangles
const Skip10BackIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Double filled triangles pointing left */}
    <path
      d="M20 18 L20 30 L12 24 Z M32 18 L32 30 L24 24 Z"
      fill="currentColor"
    />
    
    {/* "10s" text positioned below */}
    <text
      x="24"
      y="38"
      textAnchor="middle"
      fontSize="11"
      fontWeight="600"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
      opacity="0.9"
    >
      10s
    </text>
  </svg>
);

const Skip10ForwardIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Double filled triangles pointing right */}
    <path
      d="M16 18 L16 30 L24 24 Z M28 18 L28 30 L36 24 Z"
      fill="currentColor"
    />
    
    {/* "10s" text positioned below */}
    <text
      x="24"
      y="38"
      textAnchor="middle"
      fontSize="11"
      fontWeight="600"
      fill="currentColor"
      fontFamily="system-ui, -apple-system, sans-serif"
      opacity="0.9"
    >
      10s
    </text>
  </svg>
);

// Alternative design with better visual balance
const Skip10BackAltIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Centered double triangles */}
    <g transform="translate(24, 24)">
      {/* First triangle */}
      <path
        d="M-4 -6 L-4 6 L-10 0 Z"
        fill="currentColor"
      />
      {/* Second triangle */}
      <path
        d="M4 -6 L4 6 L-2 0 Z"
        fill="currentColor"
      />
      {/* Small "10" label as superscript */}
      <text
        x="8"
        y="-2"
        fontSize="10"
        fontWeight="700"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        10
      </text>
    </g>
  </svg>
);

const Skip10ForwardAltIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Centered double triangles */}
    <g transform="translate(24, 24)">
      {/* First triangle */}
      <path
        d="M-4 -6 L-4 6 L2 0 Z"
        fill="currentColor"
      />
      {/* Second triangle */}
      <path
        d="M4 -6 L4 6 L10 0 Z"
        fill="currentColor"
      />
      {/* Small "10" label as superscript */}
      <text
        x="-16"
        y="-2"
        fontSize="10"
        fontWeight="700"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        10
      </text>
    </g>
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
          "bg-zinc-800/50 hover:bg-zinc-800 active:bg-zinc-700",
          "border border-zinc-700/30 hover:border-zinc-600",
          "group transition-all duration-200",
          "rounded-lg shadow-sm hover:shadow-md",
          "flex items-center justify-center"
        )}
        aria-label="Skip backward 10 seconds"
        title="Skip backward 10 seconds"
      >
        <Skip10BackIcon className="h-8 w-8 sm:h-9 sm:w-9 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onSkipForward}
        disabled={disabled}
        className={cn(
          "relative h-12 w-12 sm:h-14 sm:w-14 p-0",
          "bg-zinc-800/50 hover:bg-zinc-800 active:bg-zinc-700",
          "border border-zinc-700/30 hover:border-zinc-600",
          "group transition-all duration-200",
          "rounded-lg shadow-sm hover:shadow-md",
          "flex items-center justify-center"
        )}
        aria-label="Skip forward 10 seconds"
        title="Skip forward 10 seconds"
      >
        <Skip10ForwardIcon className="h-8 w-8 sm:h-9 sm:w-9 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
      </Button>
    </div>
  );
}