
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

type DeliveryStat = {
  status: string;
  error_category: string | null;
  total_messages: number;
  retried_messages: number;
  avg_retries: number;
  avg_delivery_time_seconds: number;
};

type RetryEffectiveness = {
  initial_error_category: string;
  total_retries: number;
  successful_retries: number;
  success_rate: number;
};

export default function MessageStats() {
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStat[]>([]);
  const [retryStats, setRetryStats] = useState<RetryEffectiveness[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch delivery stats
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('message_delivery_stats')
        .select('*');
      
      if (deliveryError) throw deliveryError;
      
      // Fetch retry effectiveness
      const { data: retryData, error: retryError } = await supabase
        .from('retry_effectiveness')
        .select('*');
      
      if (retryError) throw retryError;
      
      setDeliveryStats(deliveryData || []);
      setRetryStats(retryData || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-primary" />
          Delivery Statistics
        </h3>
        <div className="space-y-4">
          {deliveryStats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <span className="font-medium capitalize">{stat.status}</span>
                {stat.error_category && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({stat.error_category})
                  </span>
                )}
              </div>
              <div className="text-sm">
                <span className="px-2 py-1 rounded-full bg-primary/10">
                  {stat.total_messages} messages
                </span>
                {stat.retried_messages > 0 && (
                  <span className="ml-2 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">
                    {stat.retried_messages} retries
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 text-primary" />
          Retry Effectiveness
        </h3>
        <div className="space-y-4">
          {retryStats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center">
              <div>
                <span className="font-medium capitalize">{stat.initial_error_category}</span>
              </div>
              <div className="text-sm flex items-center space-x-2">
                <span className="px-2 py-1 rounded-full bg-primary/10">
                  {stat.success_rate}% success
                </span>
                <span className="text-muted-foreground">
                  ({stat.successful_retries}/{stat.total_retries})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
