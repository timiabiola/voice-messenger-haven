
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Twilio webhook function was invoked"); // 1. Confirm invocation
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Processing incoming webhook request"); // 2. Start processing
    const formData = await req.formData()
    console.log('Received Twilio webhook data:', Object.fromEntries(formData.entries()))

    const callSid = formData.get('CallSid')
    const recordingUrl = formData.get('RecordingUrl')
    const recordingDuration = formData.get('RecordingDuration')
    const from = formData.get('From')
    const status = formData.get('CallStatus') || formData.get('RecordingStatus')

    console.log('Parsed webhook data:', { callSid, recordingUrl, recordingDuration, from, status }); // 3. Data parsed

    // Initialize Supabase client
    console.log('Initializing Supabase client...'); // 4. Pre-Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    console.log('Supabase client initialized'); // 5. Post-Supabase

    if (recordingUrl) {
      console.log('Processing recording:', { recordingUrl, callSid, duration: recordingDuration })
      
      // Download recording from Twilio using fetch with enhanced logging
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
      const auth = btoa(`${accountSid}:${authToken}`)

      console.log('Attempting to download recording from:', `${recordingUrl}.mp3`); // 6. Pre-download

      const recordingResponse = await fetch(`${recordingUrl}.mp3`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      })

      // Log response status for debugging
      console.log('Twilio recording download response:', {
        status: recordingResponse.status,
        headers: Object.fromEntries(recordingResponse.headers.entries())
      }); // 7. Post-download

      if (!recordingResponse.ok) {
        const errorData = await recordingResponse.text()
        console.error('Twilio API error response:', {
          status: recordingResponse.status,
          body: errorData,
          headers: Object.fromEntries(recordingResponse.headers.entries())
        });
        throw new Error(`Failed to download recording from Twilio. Status: ${recordingResponse.status}`)
      }

      const audioBlob = await recordingResponse.blob()
      console.log('Successfully downloaded recording:', {
        size: audioBlob.size,
        type: audioBlob.type
      }); // 8. Blob created

      const fileName = `${callSid}.mp3`

      // Upload to Supabase Storage with enhanced logging
      console.log('Attempting to upload to Supabase storage:', fileName); // 9. Pre-upload

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('voice_messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mpeg',
          upsert: true
        })

      if (uploadError) {
        console.error('Storage upload error details:', uploadError)
        throw new Error(`Failed to upload to storage: ${uploadError.message}`)
      }

      console.log('File uploaded successfully to storage:', uploadData); // 10. Post-upload

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase
        .storage
        .from('voice_messages')
        .getPublicUrl(fileName)

      console.log('Generated public URL:', publicUrl); // 11. URL generated

      // Find the user associated with this phone number
      console.log('Looking up user profile for phone:', from); // 12. Pre-profile lookup
      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', from)
        .single()

      if (senderError) {
        console.warn('Could not find user profile:', { phone: from, error: senderError })
      } else {
        console.log('Found user profile:', senderProfile); // 13. Profile found
      }

      // Create voice message record with enhanced logging
      console.log('Creating voice message record...'); // 14. Pre-record creation

      const { data: messageData, error: dbError } = await supabase
        .from('voice_messages')
        .insert({
          id: callSid,
          audio_url: publicUrl,
          duration: parseInt(recordingDuration as string) || 0,
          phone_number: from as string,
          twilio_sid: callSid as string,
          twilio_status: status as string,
          sender_id: senderProfile?.id || null,
          title: 'Voice Message via Phone',
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database insert error details:', dbError)
        throw new Error(`Failed to update database: ${dbError.message}`)
      }

      console.log('Voice message record created:', messageData); // 15. Record created

      // If we found a sender, automatically add their default recipients
      if (senderProfile?.id) {
        console.log('Processing default recipients for sender:', senderProfile.id); // 16. Pre-recipients

        // Get user's default voice message recipients
        const { data: defaultRecipients, error: recipientsError } = await supabase
          .from('voice_message_recipients')
          .select('recipient_id')
          .eq('sender_id', senderProfile.id)
          .eq('is_default', true)

        if (recipientsError) {
          console.error('Error fetching default recipients:', recipientsError)
        } else if (defaultRecipients?.length > 0) {
          console.log('Found default recipients:', defaultRecipients.length)

          // Create recipient records for this message
          const recipientRecords = defaultRecipients.map(({ recipient_id }) => ({
            voice_message_id: messageData.id,
            recipient_id,
            created_at: new Date().toISOString()
          }))

          const { error: insertError } = await supabase
            .from('voice_message_recipients')
            .insert(recipientRecords)

          if (insertError) {
            console.error('Failed to add default recipients:', insertError)
          } else {
            console.log('Successfully added default recipients'); // 17. Recipients added
          }
        }
      }

      console.log('Recording processing completed successfully'); // 18. All done
      return new Response(
        JSON.stringify({ success: true, message: 'Recording processed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle incoming calls using TwiML
    if (status === 'ringing') {
      console.log('Handling incoming call, generating TwiML response')

      // Create a simple TwiML response using XML string
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>Please leave your message after the beep.</Say>
          <Record
            action="${req.url}"
            transcribe="false"
            maxLength="300"
            playBeep="true"
            trim="trim-silence"
          />
        </Response>`

      return new Response(twiml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/xml'
        }
      })
    }

    console.log('Webhook processed successfully'); // 19. Success
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Detailed error in Twilio webhook:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
