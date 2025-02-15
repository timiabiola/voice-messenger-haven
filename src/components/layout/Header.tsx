
import { ChevronLeft, MoreVertical, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

export const Header = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleNewMessage = () => {
    navigate('/new-0');
  };

  const handleMoreOptions = () => {
    toast({
      title: "More options",
      description: "This feature will be available soon",
    });
  };

  return (
    <header className="bg-[#2196F3] text-white p-4 fixed top-0 w-full z-10">
      <div className="flex justify-between items-center">
        <button 
          className="flex items-center"
          onClick={handleBack}
        >
          <ChevronLeft size={24} />
          <span className="ml-2">Select</span>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={handleMoreOptions}>
            <MoreVertical size={24} />
          </button>
          <button 
            className="bg-white text-[#2196F3] rounded-full p-2 hover:bg-opacity-90 transition-colors"
            onClick={handleNewMessage}
          >
            <Plus size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
