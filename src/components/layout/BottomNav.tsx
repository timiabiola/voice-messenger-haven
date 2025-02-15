
import { LayoutGrid, Mic, Users, Bookmark } from 'lucide-react';

export const BottomNav = () => (
  <nav className="fixed bottom-0 w-full max-w-md bg-white border-t p-4 z-10">
    <div className="grid grid-cols-4 gap-4">
      <button className="flex justify-center text-[#9E9E9E]">
        <LayoutGrid size={24} />
      </button>
      <button className="flex justify-center text-[#9E9E9E]">
        <Mic size={24} />
      </button>
      <button className="flex justify-center text-[#9E9E9E]">
        <Users size={24} />
      </button>
      <button className="flex justify-center text-[#9E9E9E]">
        <Bookmark size={24} />
      </button>
    </div>
  </nav>
);

export default BottomNav;
