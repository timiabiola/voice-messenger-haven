
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
    <div className="relative bg-background min-h-screen w-full">
      <Header />
      <main className="flex-1 min-h-screen w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
