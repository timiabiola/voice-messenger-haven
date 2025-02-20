
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const useMobileInteraction = () => {
  const [userInteracted, setUserInteracted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      const handleFirstTouch = () => {
        setUserInteracted(true);
        document.removeEventListener('touchstart', handleFirstTouch);
      };
      
      document.addEventListener('touchstart', handleFirstTouch);
      return () => document.removeEventListener('touchstart', handleFirstTouch);
    }
  }, [isMobile]);

  return { userInteracted, setUserInteracted, isMobile };
};
