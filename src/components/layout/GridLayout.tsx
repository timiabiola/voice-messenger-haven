
import { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';

interface GridLayoutProps {
  children: ReactNode;
}

const GridLayout = ({ children }: GridLayoutProps) => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default GridLayout;
