
import React from 'react';
import Header from './layout/Header';
import BottomNav from './layout/BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <main className="max-w-md mx-auto min-h-screen bg-white relative">
      <Header />
      <div className="pt-28 pb-20">
        {children}
      </div>
      <BottomNav />
    </main>
  );
};

export default AppLayout;
