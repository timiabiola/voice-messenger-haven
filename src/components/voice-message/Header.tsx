
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  isRecording: boolean;
  isProcessing: boolean;
  onSend: () => void;
}

export const Header = ({ isRecording, isProcessing, onSend }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 flex items-center justify-between px-4 bg-white border-b fixed top-0 left-0 right-0 z-10">
      <button 
        className="p-2 hover:bg-gray-100 rounded-full"
        onClick={() => navigate('/')}
      >
        <ChevronLeft className="w-6 h-6 text-gray-600" />
      </button>
      <h1 className="text-lg font-semibold">New Voice Message</h1>
      <button 
        className={`text-blue-600 font-medium ${
          !isRecording || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-700'
        }`}
        disabled={!isRecording || isProcessing}
        onClick={onSend}
      >
        Send
      </button>
    </header>
  );
};
