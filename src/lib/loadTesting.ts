
import { supabase } from '@/integrations/supabase/client';

export interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  delayBetweenRequests: number;
}

export const runLoadTest = async (config: LoadTestConfig) => {
  try {
    const { data, error } = await supabase.functions.invoke('load-test', {
      body: { config },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Load test error:', error);
    throw error;
  }
};
