
import { ReactNode } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import Header from './Header';
import BottomNav from './BottomNav';
import { AppSidebar } from './AppSidebar';

interface SidebarLayoutProps {
  children: ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <Header />
          <main className="pt-28 pb-20">
            <div className="px-4">
              {children}
            </div>
          </main>
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;
