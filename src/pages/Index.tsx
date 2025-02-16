
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import CategoryTabs from '@/components/layout/CategoryTabs';
import EmptyState from '@/components/layout/EmptyState';

export default function Home() {
  const [currentCategory, setCurrentCategory] = useState('inbox');
  const [messages] = useState({
    new: [],
    inbox: [],
    saved: Array(309).fill({}),
    trash: [],
  });

  return (
    <AppLayout>
      <div className="bg-black min-h-screen">
        <CategoryTabs
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
          counts={{
            new: messages.new.length,
            inbox: messages.inbox.length,
            saved: messages.saved.length,
            trash: messages.trash.length,
          }}
        />
        
        <div className="mt-28 px-4">
          {messages[currentCategory as keyof typeof messages]?.length === 0 ? (
            <div className="text-[#ffcc00]">
              <EmptyState />
            </div>
          ) : (
            <div className="text-[#ffcc00]">{/* Message list content */}</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
