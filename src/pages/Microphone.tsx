
import AppLayout from '@/components/AppLayout';
import { Mic } from 'lucide-react';

const Microphone = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <button className="p-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors">
        <Mic size={32} />
      </button>
      <p className="mt-4 text-gray-600">Tap to start recording</p>
    </div>
  );
};

export default Microphone;
