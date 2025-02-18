
import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface GridLayoutProps {
  children: ReactNode;
}

const GridLayout = ({ children }: GridLayoutProps) => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default GridLayout;
