
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/components/voice-message/Recipients';

export function useMessageUpload() {
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [recipients, setRecipients] = useState<Profile[]>([]);
  const [subject, setSubject] = useState('');

  const uploadMessage = async (audioChunks: Blob[]) => {
    if (audioChunks.length === 0) {
      throw new Error('No recording to send');
    }

    if (recipients.length === 0) {
      throw new Error('Please select at least one recipient');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Please sign in to send messages');
    }

    console.log('Starting voice message upload process...');

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
      console.error('Error calculating duration:', error);
      duration = Math.ceil(audioBlob.size / 1024);
    }

    duration = Math.max(1, Math.min(duration, 300));

    console.log('Final audio duration:', duration, 'seconds');
    
    const fileName = `voice_message_${Date.now()}.m4a`;
    console.log('Uploading file:', fileName, 'size:', audioBlob.size, 'bytes');

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice_messages')
      .upload(fileName, audioBlob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error('Failed to upload voice message');
    }

    console.log('File uploaded successfully:', uploadData);

    const { data: { publicUrl } } = supabase.storage
      .from('voice_messages')
      .getPublicUrl(fileName);

    console.log('Got public URL:', publicUrl);

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
      console.error('Voice message creation error:', dbError);
      throw new Error('Failed to save voice message');
    }

    console.log('Voice message created:', messageData);

    for (const recipient of recipients) {
      console.log('Adding recipient:', recipient.id);
      const { error: recipientError } = await supabase.rpc('safe_recipient_insert', {
        message_id: messageData.id,
        recipient_id: recipient.id,
        sender_id: session.user.id
      });

      if (recipientError) {
        console.error('Failed to add recipient:', recipient.id, recipientError);
        throw new Error(`Failed to add recipient: ${recipient.email}`);
      }
    }

    console.log('All recipients added successfully');
    return messageData;
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
