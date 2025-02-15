
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
    <div className={`mx-auto bg-white min-h-screen flex flex-col ${isMobile ? 'w-full' : 'max-w-3xl'}`}>
      <Header />
      <main className="flex-1 pt-16 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
