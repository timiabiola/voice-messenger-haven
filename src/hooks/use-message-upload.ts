
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/components/voice-message/Recipients';
import { logger } from '@/utils/logger';
import { sanitizeError } from '@/utils/error-handler';

export function useMessageUpload() {
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [recipients, setRecipients] = useState<Profile[]>([]);
  const [subject, setSubject] = useState('');

  const uploadMessage = async (audioChunks: Blob[]) => {
    // DEBUG: Start of upload process
    logger.log('DEBUG: Starting uploadMessage with', audioChunks.length, 'chunks');
    
    try {
      if (audioChunks.length === 0) {
        throw new Error('No recording to send');
      }

      if (recipients.length === 0) {
        throw new Error('Please select at least one recipient');
      }

      // DEBUG: Check authentication
      logger.log('DEBUG: Checking authentication...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      logger.error('Session error:', sessionError.message);
      throw new Error('Authentication error. Please sign in again.');
    }
    if (!session) {
      throw new Error('Please sign in to send messages');
    }
    
    logger.log('User authenticated');

    logger.log('Starting voice message upload process...');

    // Create a single Blob with the correct MIME type
    const mimeType = 'audio/mp4;codecs=mp4a.40.2';
    const audioBlob = new Blob(audioChunks, { type: mimeType });
    
    // Calculate duration based on the audio chunks
    let duration = 0;
    try {
      const durationPromise = new Promise<number>((resolve, reject) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(audioBlob);
        
        const cleanup = () => {
          URL.revokeObjectURL(objectUrl);
          audio.removeAttribute('src');
          audio.load();
        };

        const timeoutId = setTimeout(() => {
          cleanup();
          const estimatedDuration = Math.ceil(audioBlob.size / 1024);
          resolve(Math.min(estimatedDuration, 300));
        }, 3000);

        const handleLoadedMetadata = () => {
          clearTimeout(timeoutId);
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            const calculatedDuration = Math.round(audio.duration);
            cleanup();
            resolve(calculatedDuration);
          } else {
            cleanup();
            const estimatedDuration = Math.ceil(audioBlob.size / 1024);
            resolve(Math.min(estimatedDuration, 300));
          }
        };

        const handleError = (e: Event) => {
          clearTimeout(timeoutId);
          cleanup();
          const estimatedDuration = Math.ceil(audioBlob.size / 1024);
          resolve(Math.min(estimatedDuration, 300));
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);
        audio.src = objectUrl;
      });

      duration = await durationPromise;
    } catch (error) {
      logger.error('Error calculating duration:', error);
      duration = Math.ceil(audioBlob.size / 1024);
    }

    duration = Math.max(1, Math.min(duration, 300));

    logger.log('Final audio duration:', duration, 'seconds');
    
    // Create file path with user ID to match RLS policy: recordings/USER_ID/filename
    const fileName = `recordings/${session.user.id}/voice_message_${Date.now()}.m4a`;
    logger.log('Uploading file with size:', audioBlob.size, 'bytes');
    
    // DEBUG: Storage upload
    logger.log('DEBUG: Starting storage upload to bucket "voice-recordings"');
    logger.log('DEBUG: File path:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(fileName, audioBlob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      logger.error('Storage upload error:', uploadError.message);
      logger.error('DEBUG: Full upload error:', uploadError);
      throw new Error(`Failed to upload voice message: ${uploadError.message}`);
    }

    logger.log('File uploaded successfully');

    const { data: { publicUrl } } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(fileName);

    logger.log('Got public URL for uploaded file');
    
    // DEBUG: Database insert
    logger.log('DEBUG: Inserting voice message into database');
    logger.log('DEBUG: Message data:', {
      title: subject || 'Voice Message',
      subject,
      audio_url: publicUrl,
      duration: duration,
      is_urgent: isUrgent,
      is_private: isPrivate,
      sender_id: session.user.id
    });

    const { data: messageData, error: dbError } = await supabase
      .from('voice_messages')
      .insert({
        title: subject || 'Voice Message',
        subject,
        audio_url: publicUrl,
        duration: duration,
        is_urgent: isUrgent,
        is_private: isPrivate,
        sender_id: session.user.id
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Voice message creation error:', dbError.message);
      logger.error('DEBUG: Full database error:', dbError);
      logger.error('DEBUG: Error code:', dbError.code);
      logger.error('DEBUG: Error details:', dbError.details);
      throw new Error(`Failed to save voice message: ${dbError.message}`);
    }

    logger.log('Voice message created successfully');

    for (const recipient of recipients) {
      logger.log('Adding recipient');
      // DEBUG: RPC call
      logger.log('DEBUG: Calling safe_recipient_insert RPC');
      logger.log('DEBUG: RPC params:', {
        message_id: messageData.id,
        recipient_id: recipient.id,
        sender_id: session.user.id
      });
      
      const { error: recipientError } = await supabase.rpc('safe_recipient_insert', {
        message_id: messageData.id,
        recipient_id: recipient.id,
        sender_id: session.user.id
      });

      if (recipientError) {
        logger.error('Failed to add recipient:', recipientError.message);
        logger.error('DEBUG: Full RPC error:', recipientError);
        logger.error('DEBUG: RPC error code:', recipientError.code);
        logger.error('DEBUG: RPC error details:', recipientError.details);
        throw new Error(`Failed to add recipient ${recipient.email}: ${recipientError.message}`);
      }
    }

    logger.log('All recipients added successfully');
    
    // Trigger notification edge function
    try {
      logger.log('Triggering notification for message');
      const { data: notificationData, error: notificationError } = await supabase.functions.invoke('voice-message-notification', {
        body: {
          type: 'INSERT',
          record: messageData
        }
      });
      
      if (notificationError) {
        logger.error('Notification error:', notificationError);
        // Don't throw - notifications should not block message sending
      } else {
        logger.log('Notification triggered successfully');
      }
    } catch (notificationError) {
      logger.error('Failed to trigger notification:', notificationError);
      // Don't throw - notifications should not block message sending
    }
    
    return messageData;
    
    } catch (error) {
      logger.error('Upload message error:', error);
      
      // DEBUG: Log the actual error before sanitization
      logger.error('DEBUG: ACTUAL ERROR BEFORE SANITIZATION:');
      logger.error('DEBUG: Error type:', typeof error);
      logger.error('DEBUG: Error message:', error instanceof Error ? error.message : 'Not an Error instance');
      logger.error('DEBUG: Full error object:', error);
      
      // Sanitize error before throwing
      const sanitized = sanitizeError(error);
      throw new Error(sanitized.message);
    }
  };

  return {
    isUrgent,
    setIsUrgent,
    isPrivate,
    setIsPrivate,
    recipients,
    setRecipients,
    subject,
    setSubject,
    uploadMessage
  };
}
