
import React from 'react';
import Header from './layout/Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <main className="max-w-md mx-auto min-h-screen bg-white relative">
      <Header />
      <div className="pt-16">
        {children}
      </div>
    </main>
  );
};

export default AppLayout;
