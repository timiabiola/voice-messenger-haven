
import { ChevronLeft, MoreVertical, Plus } from 'lucide-react';

export const Header = () => (
  <header className="bg-[#2196F3] text-white p-4 fixed top-0 w-full max-w-md z-10">
    <div className="flex justify-between items-center">
      <button className="flex items-center">
        <ChevronLeft size={24} />
        <span className="ml-2">Select</span>
      </button>
      <div className="flex items-center gap-4">
        <MoreVertical size={24} />
        <button className="bg-white text-[#2196F3] rounded-full p-2">
          <Plus size={24} />
        </button>
      </div>
    </div>
  </header>
);

export default Header;
