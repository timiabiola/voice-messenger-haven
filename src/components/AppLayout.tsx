
import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <main className="max-w-md mx-auto min-h-screen bg-white relative">
      {children}
    </main>
  );
};

export default AppLayout;
