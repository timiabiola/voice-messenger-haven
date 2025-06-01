
import React from 'react';
import Header from './layout/Header';
import BottomNav from './layout/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  unreadCount?: number;
}

const AppLayout = ({ children, onSearch, unreadCount = 0 }: AppLayoutProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const showSearch = location.pathname.includes('inbox');

  return (
    <div className="relative bg-background min-h-screen w-full">
      <Header onSearch={onSearch} showSearch={showSearch} />
      <main className="flex-1 min-h-screen w-full">
        {children}
      </main>
      <BottomNav unreadCount={unreadCount} />
    </div>
  );
};

export default AppLayout;
