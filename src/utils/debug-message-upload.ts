/**
 * TEMPORARY DEBUG UTILITY - TO BE REMOVED AFTER FIXING THE ISSUE
 * This utility helps diagnose message upload issues
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export async function runMessageUploadDiagnostics() {
  logger.log('=== RUNNING MESSAGE UPLOAD DIAGNOSTICS ===');
  
  const results = {
    auth: false,
    storageBucket: false,
    voiceMessagesTable: false,
    recipientsTable: false,
    rpcFunction: false,
    storageUploadTest: false,
    errors: [] as string[]
  };

  try {
    // 1. Check authentication
    logger.log('1. Checking authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      results.errors.push(`Auth error: ${authError.message}`);
    } else if (session) {
      results.auth = true;
      logger.log('✓ Authentication successful');
    } else {
      results.errors.push('No active session');
    }

    // 2. Check storage bucket
    logger.log('2. Checking storage bucket...');
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        results.errors.push(`Bucket list error: ${bucketError.message}`);
      } else {
        const voiceRecordingsBucket = buckets?.find(b => b.name === 'voice-recordings');
        if (voiceRecordingsBucket) {
          results.storageBucket = true;
          logger.log('✓ Storage bucket "voice-recordings" exists');
        } else {
          results.errors.push('Storage bucket "voice-recordings" not found');
          logger.log('Available buckets:', buckets?.map(b => b.name));
        }
      }
    } catch (e) {
      results.errors.push(`Bucket check exception: ${e}`);
    }

    // 3. Check voice_messages table structure
    logger.log('3. Checking voice_messages table...');
    try {
      // Try to query the table with limit 0 to check structure
      const { data, error: tableError } = await supabase
        .from('voice_messages')
        .select('*')
        .limit(0);
      
      if (tableError) {
        results.errors.push(`voice_messages table error: ${tableError.message}`);
        logger.error('Table error details:', tableError);
      } else {
        results.voiceMessagesTable = true;
        logger.log('✓ voice_messages table accessible');
      }
    } catch (e) {
      results.errors.push(`voice_messages check exception: ${e}`);
    }

    // 4. Check voice_message_recipients table
    logger.log('4. Checking voice_message_recipients table...');
    try {
      const { data, error: recipientsError } = await supabase
        .from('voice_message_recipients')
        .select('*')
        .limit(0);
      
      if (recipientsError) {
        results.errors.push(`voice_message_recipients table error: ${recipientsError.message}`);
      } else {
        results.recipientsTable = true;
        logger.log('✓ voice_message_recipients table accessible');
      }
    } catch (e) {
      results.errors.push(`recipients table check exception: ${e}`);
    }

    // 5. Check RPC function exists
    logger.log('5. Checking safe_recipient_insert RPC function...');
    try {
      // We can't easily check if an RPC function exists without calling it
      // So we'll note this for manual verification
      logger.log('⚠ RPC function existence must be verified manually in Supabase dashboard');
    } catch (e) {
      results.errors.push(`RPC check exception: ${e}`);
    }

    // 6. Test storage upload (if authenticated)
    if (results.auth && session) {
      logger.log('6. Testing storage upload...');
      try {
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const testFileName = `recordings/${session.user.id}/test_${Date.now()}.txt`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('voice-recordings')
          .upload(testFileName, testBlob);
        
        if (uploadError) {
          results.errors.push(`Storage upload test failed: ${uploadError.message}`);
          logger.error('Upload test error:', uploadError);
        } else {
          results.storageUploadTest = true;
          logger.log('✓ Storage upload test successful');
          
          // Clean up test file
          await supabase.storage
            .from('voice-recordings')
            .remove([testFileName]);
        }
      } catch (e) {
        results.errors.push(`Storage upload test exception: ${e}`);
      }
    }

  } catch (e) {
    results.errors.push(`Diagnostic exception: ${e}`);
  }

  // Summary
  logger.log('\n=== DIAGNOSTIC RESULTS ===');
  logger.log('Auth:', results.auth ? '✓' : '✗');
  logger.log('Storage Bucket:', results.storageBucket ? '✓' : '✗');
  logger.log('Voice Messages Table:', results.voiceMessagesTable ? '✓' : '✗');
  logger.log('Recipients Table:', results.recipientsTable ? '✓' : '✗');
  logger.log('Storage Upload Test:', results.storageUploadTest ? '✓' : '✗');
  
  if (results.errors.length > 0) {
    logger.log('\nERRORS FOUND:');
    results.errors.forEach((err, i) => {
      logger.error(`${i + 1}. ${err}`);
    });
  }
  
  logger.log('=== END DIAGNOSTICS ===\n');
  
  return results;
}