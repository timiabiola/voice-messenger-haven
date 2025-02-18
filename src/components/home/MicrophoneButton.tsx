
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MicrophoneButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="default"
      size="icon"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full shadow-lg hover:shadow-xl 
        active:shadow-md transition-all w-14 h-14 bg-primary"
      onClick={() => navigate('/microphone')}
    >
      <Mic className="w-7 h-7" />
    </Button>
  );
};
