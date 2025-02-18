
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MicrophoneButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="default"
      size="icon"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-full shadow-lg hover:shadow-xl 
        active:shadow-md transition-all w-16 h-16 bg-primary z-50"
      onClick={() => navigate('/microphone')}
    >
      <Mic className="w-8 h-8" />
    </Button>
  );
};
