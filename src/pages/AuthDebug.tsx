import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check environment variables
        const envInfo = {
          VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'NOT SET',
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET',
          currentUrl: window.location.href,
          origin: window.location.origin,
        };

        // Check session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // Check user
        const { data: userData, error: userError } = await supabase.auth.getUser();

        // Test API connection
        let apiTest: { status: string; error?: string } = { status: 'pending' };
        try {
          const { data, error } = await supabase.from('profiles').select('count').limit(1);
          apiTest = { status: 'success', error: error?.message };
        } catch (e: any) {
          apiTest = { status: 'error', error: e.message };
        }

        setDebugInfo({
          environment: envInfo,
          session: {
            exists: !!sessionData?.session,
            error: sessionError?.message,
            user: sessionData?.session?.user?.email || sessionData?.session?.user?.phone,
          },
          user: {
            exists: !!userData?.user,
            error: userError?.message,
          },
          apiConnection: apiTest,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        setDebugInfo({
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-black p-4">
      <Card className="max-w-4xl mx-auto bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-amber-400">Authentication Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-white">Loading debug info...</div>
          ) : (
            <pre className="text-xs text-gray-300 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 