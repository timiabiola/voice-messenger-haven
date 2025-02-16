
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <header className="bg-background border-b border-border text-foreground p-4 fixed top-0 w-full z-10">
      <div className="flex justify-between items-center">
        <button 
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleBack}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
