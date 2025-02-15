
import React from 'react';
import Header from './layout/Header';
import BottomNav from './layout/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="relative bg-white min-h-screen">
      <div className={`mx-auto ${isMobile ? 'w-full' : 'max-w-3xl'}`}>
        <Header />
        <main className="flex-1 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
