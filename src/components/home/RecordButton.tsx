
import { Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RecordButton = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-20 right-0 left-0 px-4 z-50">
      <div className="max-w-lg mx-auto relative">
        <button 
          onClick={() => navigate('/microphone')}
          className="absolute right-0 w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-300 transition-colors active:scale-95 touch-manipulation"
          aria-label="Record message"
        >
          <Mic className="w-6 h-6 text-black" />
          <span className="sr-only">Record</span>
        </button>
      </div>
    </div>
  );
};
