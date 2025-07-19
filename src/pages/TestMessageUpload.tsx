import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/utils/logger';
import type { Session } from '@supabase/supabase-js';

export default function TestMessageUpload() {
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [messageId, setMessageId] = useState<string>('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    checkSession();
  }, []);

  const addResult = (result: string) => {
    setResults(prev => [...prev, result]);
    logger.log(result);
  };

  // Test 1: Storage Upload
  const testStorage = async () => {
    addResult('=== Testing Storage Upload ===');
    try {
      const blob = new Blob(['test audio data'], { type: 'audio/mp4' });
      const fileName = `recordings/${session?.user?.id}/test-${Date.now()}.m4a`;
      
      const result = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, blob);
      
      if (result.error) {
        addResult(`❌ Storage Error: ${JSON.stringify(result.error)}`);
      } else {
        addResult(`✅ Storage Success: ${result.data.path}`);
      }
    } catch (error) {
      addResult(`❌ Storage Exception: ${error}`);
    }
  };

  // Test 2: Database Insert (without audio_url first)
  const testDbInsert = async () => {
    addResult('=== Testing Database Insert (no audio_url) ===');
    try {
      const result = await supabase
        .from('voice_messages')
        .insert({
          title: 'Test Message',
          subject: 'Test Subject',
          sender_id: session?.user?.id,
          duration: 10,
          is_urgent: false,
          is_private: false
        })
        .select();
      
      if (result.error) {
        addResult(`❌ DB Error: ${JSON.stringify(result.error)}`);
      } else {
        addResult(`✅ DB Success: ${JSON.stringify(result.data)}`);
        if (result.data?.[0]?.id) {
          setMessageId(result.data[0].id);
          addResult(`📝 Message ID saved: ${result.data[0].id}`);
        }
      }
    } catch (error) {
      addResult(`❌ DB Exception: ${error}`);
    }
  };

  // Test 3: Database Insert with audio_url
  const testDbInsertWithAudio = async () => {
    addResult('=== Testing Database Insert (with audio_url) ===');
    try {
      const audioUrl = `recordings/${session?.user?.id}/test-audio.m4a`;
      
      const result = await supabase
        .from('voice_messages')
        .insert({
          title: 'Test Message with Audio',
          subject: 'Test Subject',
          audio_url: audioUrl,
          sender_id: session?.user?.id,
          duration: 10,
          is_urgent: false,
          is_private: false
        })
        .select();
      
      if (result.error) {
        addResult(`❌ DB Error: ${JSON.stringify(result.error)}`);
      } else {
        addResult(`✅ DB Success: ${JSON.stringify(result.data)}`);
        if (result.data?.[0]?.id) {
          setMessageId(result.data[0].id);
          addResult(`📝 Message ID saved: ${result.data[0].id}`);
        }
      }
    } catch (error) {
      addResult(`❌ DB Exception: ${error}`);
    }
  };

  // Test 4: RPC Function
  const testRPC = async () => {
    if (!messageId) {
      addResult('❌ No message ID available. Run DB insert test first.');
      return;
    }

    addResult('=== Testing RPC Function ===');
    try {
      // Create a test recipient ID (you might want to use a real user ID from your database)
      const testRecipientId = '00000000-0000-0000-0000-000000000000';
      
      const result = await supabase.rpc('safe_recipient_insert', {
        message_id: messageId,
        recipient_id: testRecipientId,
        sender_id: session?.user?.id
      });
      
      if (result.error) {
        addResult(`❌ RPC Error: ${JSON.stringify(result.error)}`);
      } else {
        addResult(`✅ RPC Success: ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      addResult(`❌ RPC Exception: ${error}`);
    }
  };

  // Test 5: Check table columns
  const checkTableStructure = async () => {
    addResult('=== Checking Table Structure ===');
    try {
      const { data, error } = await supabase
        .from('voice_messages')
        .select('*')
        .limit(0);
      
      if (error) {
        addResult(`❌ Table Query Error: ${JSON.stringify(error)}`);
      } else {
        addResult(`✅ Table accessible`);
        // Try to get column info from a test insert
        const testInsert = await supabase
          .from('voice_messages')
          .insert({
            title: 'Column Test',
            sender_id: session?.user?.id
          })
          .select();
        
        if (testInsert.error) {
          addResult(`📋 Column info from error: ${testInsert.error.message}`);
        }
      }
    } catch (error) {
      addResult(`❌ Table Check Exception: ${error}`);
    }
  };

  // Test 6: Check if safe_recipient_insert exists
  const checkRPCFunction = async () => {
    addResult('=== Checking RPC Function Existence ===');
    try {
      // Try to call with intentionally wrong parameters to see if function exists
      const { data, error } = await supabase.rpc('safe_recipient_insert', {
        wrong_param: 'test'
      });
      
      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          addResult(`❌ Function does not exist: ${error.message}`);
        } else if (error.message.includes('parameter')) {
          addResult(`✅ Function exists (parameter error): ${error.message}`);
        } else {
          addResult(`❓ Function check result: ${error.message}`);
        }
      } else {
        addResult(`✅ Function exists and returned: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      addResult(`❌ Function Check Exception: ${error}`);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto p-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Test Message Upload</h1>
          <p>Please sign in to test message upload functionality.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test Message Upload</h1>
        <p className="mb-4">Current User ID: {session.user.id}</p>
        
        <div className="space-y-4 mb-6">
          <Button onClick={testStorage} className="w-full">
            Test 1: Storage Upload
          </Button>
          
          <Button onClick={testDbInsert} className="w-full">
            Test 2: Database Insert (no audio_url)
          </Button>
          
          <Button onClick={testDbInsertWithAudio} className="w-full">
            Test 3: Database Insert (with audio_url)
          </Button>
          
          <Button onClick={testRPC} className="w-full" disabled={!messageId}>
            Test 4: RPC Function {messageId ? `(Message: ${messageId})` : '(Run Test 2 or 3 first)'}
          </Button>
          
          <Button onClick={checkTableStructure} className="w-full">
            Test 5: Check Table Structure
          </Button>
          
          <Button onClick={checkRPCFunction} className="w-full">
            Test 6: Check RPC Function
          </Button>
          
          <Button 
            onClick={() => setResults([])} 
            variant="outline" 
            className="w-full"
          >
            Clear Results
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test Results:</h2>
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {results.length === 0 ? 'No tests run yet.' : results.join('\n')}
          </pre>
        </div>
      </Card>
    </div>
  );
}