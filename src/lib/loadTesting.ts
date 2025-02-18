
import { supabase } from '@/integrations/supabase/client';

export interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  delayBetweenRequests: number;
}

export interface RateLimitInfo {
  timestamp: string;
  endpoint: string;
  requests: number;
  statusCode: number;
  remainingRequests?: number;
}

export interface LoadTestResult {
  success: boolean;
  message: string;
  testId: string;
  rateLimits: RateLimitInfo[];
}

export const runLoadTest = async (config: LoadTestConfig): Promise<LoadTestResult> => {
  try {
    const { data, error } = await supabase.functions.invoke<LoadTestResult>('load-test', {
      body: { config },
    });

    if (error) {
      console.error('Load test error:', error);
      throw new Error(`Failed to run load test: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from load test');
    }

    return data;
  } catch (error) {
    console.error('Load test error:', error);
    throw error;
  }
};

export const getLoadTestResults = async (testId: string) => {
  try {
    const { data, error } = await supabase
      .from('load_test_results')
      .select('*')
      .eq('id', testId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching test results:', error);
    throw error;
  }
};
