import { supabase } from '@/integrations/supabase/client';

export const getAudioUrl = (path: string): string => {
  // Ensure we get a URL with proper CORS headers
  const { data } = supabase.storage
    .from('voice-recordings')
    .getPublicUrl(path);
  
  // Add timestamp to prevent caching issues
  const url = new URL(data.publicUrl);
  url.searchParams.set('t', Date.now().toString());
  
  return url.toString();
};

export const ensureStorageBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('[Storage] Error listing buckets:', error);
      return false;
    }
    
    const voiceBucket = buckets?.find(b => b.id === 'voice-recordings');
    
    if (!voiceBucket) {
      console.error('[Storage] Voice recordings bucket not found!');
      console.log('[Storage] Available buckets:', buckets);
      return false;
    }
    
    console.log('[Storage] Voice recordings bucket exists:', voiceBucket);
    return true;
  } catch (error) {
    console.error('[Storage] Error checking bucket:', error);
    return false;
  }
}; 