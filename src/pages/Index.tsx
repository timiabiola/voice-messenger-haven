
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
          <EmptyState />
        ) : (
          <div>{/* Message list content */}</div>
        )}
      </div>
    </AppLayout>
  );
}
