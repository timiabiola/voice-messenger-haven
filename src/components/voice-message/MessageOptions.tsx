
import { AlertTriangle, Lock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MessageOptionsProps {
  subject: string;
  onSubjectChange: (value: string) => void;
  isUrgent: boolean;
  onUrgentChange: (value: boolean) => void;
  isPrivate: boolean;
  onPrivateChange: (value: boolean) => void;
  isProcessing: boolean;
}

export const MessageOptions = ({
  subject,
  onSubjectChange,
  isUrgent,
  onUrgentChange,
  isPrivate,
  onPrivateChange,
  isProcessing
}: MessageOptionsProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground px-1 text-center block">Subject:</label>
        <input 
          type="text"
          placeholder="Add a subject..."
          className="w-full p-2 bg-background rounded-lg border focus:border-primary outline-none h-[44px] text-center"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          disabled={isProcessing}
        />
      </div>

      <div className="flex gap-2 w-full justify-center">
        <button 
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
            isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-background text-muted-foreground'
          }`}
          onClick={() => onUrgentChange(!isUrgent)}
          disabled={isProcessing}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Urgent</span>
        </button>
        <button 
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
            isPrivate ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground'
          }`}
          onClick={() => onPrivateChange(!isPrivate)}
          disabled={isProcessing}
        >
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Private</span>
        </button>
      </div>
    </div>
  );
};
