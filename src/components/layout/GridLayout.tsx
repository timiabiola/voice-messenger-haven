
import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface GridLayoutProps {
  children: ReactNode;
}

const GridLayout = ({ children }: GridLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl px-4 flex flex-col items-center">
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default GridLayout;
