
import { MessageCircle } from 'lucide-react';

export const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
    <div className="bg-[#2196F3]/10 p-6 rounded-full mb-4">
      <MessageCircle className="text-[#2196F3]" size={48} />
    </div>
    <h2 className="text-xl font-semibold mb-2">No Messages</h2>
    <p className="text-[#757575]">Your messages will appear here</p>
  </div>
);

export default EmptyState;
