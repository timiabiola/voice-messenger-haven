
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
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
      </div>
    </header>
  );
};

export default Header;
