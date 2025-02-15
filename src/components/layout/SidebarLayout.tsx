
import { ReactNode } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from './Header';
import BottomNav from './BottomNav';

interface SidebarLayoutProps {
  children: ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Header />
        <main className="flex-1 pt-28 pb-20">
          {children}
        </main>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;
