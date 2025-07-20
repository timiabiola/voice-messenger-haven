import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  isRecording: boolean;
  isProcessing: boolean;
  hasRecording: boolean;
  onSend: () => void;
  disabled?: boolean;
}

export const Header = ({ isRecording, isProcessing, hasRecording, onSend, disabled = false }: HeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <header className="h-14 flex items-center justify-between px-3 bg-background border-b fixed top-0 left-0 right-0 z-10">
      <button 
        className="p-2 rounded-full transition-colors hover:bg-accent"
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <h1 className="text-base font-medium text-foreground">New Voice Message</h1>
      <button 
        className={`text-primary font-medium px-3 py-2 rounded-lg transition-colors ${
          !hasRecording || isProcessing || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10'
        }`}
        disabled={!hasRecording || isProcessing || disabled}
        onClick={onSend}
        title={disabled ? 'Please select at least one recipient' : undefined}
      >
        {isProcessing ? 'Sending...' : 'Send'}
      </button>
    </header>
  );
};
