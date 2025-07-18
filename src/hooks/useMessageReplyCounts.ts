import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMessageReplyCounts = (threadIds: string[]) => {
  const [replyCounts, setReplyCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReplyCounts = async () => {
      if (!threadIds.length) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('voice_messages')
          .select('thread_id')
          .in('thread_id', threadIds)
          .not('parent_message_id', 'is', null);

        if (error) throw error;

        // Count replies per thread
        const counts: Record<string, number> = {};
        threadIds.forEach(id => counts[id] = 0);
        
        data?.forEach(msg => {
          if (msg.thread_id) {
            counts[msg.thread_id] = (counts[msg.thread_id] || 0) + 1;
          }
        });

        setReplyCounts(counts);
      } catch (error) {
        console.error('Error fetching reply counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReplyCounts();
  }, [threadIds.join(',')]);

  return { replyCounts, loading };
};