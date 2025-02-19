
import { Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RecordButton = () => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed bottom-6 w-full px-6 pointer-events-none">
      <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto relative">
        <button 
          onClick={() => navigate('/new')}
          className="absolute bottom-0 right-0 w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-300 transition-colors group pointer-events-auto"
        >
          <Mic className="w-6 h-6 text-black" />
          <span className="absolute -top-10 right-0 bg-black text-amber-400 text-sm py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            Record
          </span>
        </button>
      </div>
    </div>
  );
};
