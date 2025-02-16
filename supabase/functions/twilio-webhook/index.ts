
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    console.log('Received Twilio webhook:', Object.fromEntries(formData.entries()))

    const callSid = formData.get('CallSid')
    const recordingUrl = formData.get('RecordingUrl')
    const recordingDuration = formData.get('RecordingDuration')
    const from = formData.get('From')
    const status = formData.get('CallStatus') || formData.get('RecordingStatus')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (recordingUrl) {
      console.log('Processing recording:', { recordingUrl, callSid, duration: recordingDuration })
      
      // Download recording from Twilio
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
      
      const recordingResponse = await fetch(`${recordingUrl}.mp3`, {
        headers: {
          Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`)
        }
      })

      if (!recordingResponse.ok) {
        throw new Error('Failed to download recording from Twilio')
      }

      const audioBlob = await recordingResponse.blob()
      const fileName = `${callSid}.mp3`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('voice_messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/mpeg',
          upsert: true
        })

      if (uploadError) {
        throw new Error(`Failed to upload to storage: ${uploadError.message}`)
      }

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase
        .storage
        .from('voice_messages')
        .getPublicUrl(fileName)

      // Find the user associated with this phone number
      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', from)
        .single()

      if (senderError) {
        console.warn('Could not find user profile for phone number:', from)
      }

      // Create voice message record
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
        throw new Error(`Failed to update database: ${dbError.message}`)
      }

      // If we found a sender, automatically add their default recipients
      if (senderProfile?.id) {
        // Get user's default voice message recipients
        const { data: defaultRecipients, error: recipientsError } = await supabase
          .from('voice_message_recipients')
          .select('recipient_id')
          .eq('sender_id', senderProfile.id)
          .eq('is_default', true)

        if (!recipientsError && defaultRecipients?.length > 0) {
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
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Recording processed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle incoming calls
    if (status === 'ringing') {
      // Create a simple TwiML response without using the Twilio library
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

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in Twilio webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
