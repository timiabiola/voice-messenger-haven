
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
    <main className={`mx-auto bg-white relative ${isMobile ? 'w-full' : 'max-w-3xl'}`}>
      <Header />
      <div className="pt-16 pb-20">
        {children}
      </div>
      <BottomNav />
    </main>
  );
};

export default AppLayout;
