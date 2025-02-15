
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import CategoryTabs from '@/components/layout/CategoryTabs';
import EmptyState from '@/components/layout/EmptyState';
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [currentCategory, setCurrentCategory] = useState('inbox');

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', currentCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('category', currentCategory);
      
      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  const counts = {
    new: messages?.filter(m => m.category === 'new').length || 0,
    inbox: messages?.filter(m => m.category === 'inbox').length || 0,
    saved: messages?.filter(m => m.category === 'saved').length || 0,
    trash: messages?.filter(m => m.category === 'trash').length || 0,
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="pt-14 pb-16">
      <CategoryTabs
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
        counts={counts}
      />
      
      <div className="mt-28 px-4">
        {!messages || messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className="p-4 bg-white rounded-lg shadow"
              >
                <h3 className="font-medium">{message.title}</h3>
                <p className="text-gray-600 mt-1">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
