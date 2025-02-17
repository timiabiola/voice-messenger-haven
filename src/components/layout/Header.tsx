
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Header = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <header className="bg-background border-b border-border text-foreground p-4 fixed top-0 w-full z-10">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost"
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleBack}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
