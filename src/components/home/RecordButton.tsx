
import { Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RecordButton = () => {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate('/microphone')}
      className="fixed bottom-6 right-4 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-300 transition-colors group"
    >
      <Mic className="w-5 h-5 md:w-6 md:h-6 text-black" />
      <span className="absolute -top-10 right-0 bg-black text-amber-400 text-xs md:text-sm py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
        Record
      </span>
    </button>
  );
};
