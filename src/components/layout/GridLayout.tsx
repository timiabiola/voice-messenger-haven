
import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface GridLayoutProps {
  children: ReactNode;
}

const GridLayout = ({ children }: GridLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-start p-4">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default GridLayout;
