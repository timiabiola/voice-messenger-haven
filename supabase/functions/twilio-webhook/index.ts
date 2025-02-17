
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import twilio from 'https://esm.sh/twilio'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Twilio webhook function was invoked")
  
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request")
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Processing incoming webhook request")
    const formData = await req.formData()
    console.log('Received Twilio webhook data:', Object.fromEntries(formData.entries()))

    const callSid = formData.get('CallSid')
    const recordingUrl = formData.get('RecordingUrl')
    const recordingDuration = formData.get('RecordingDuration')
    const from = formData.get('From')
    const status = formData.get('CallStatus') || formData.get('RecordingStatus')

    console.log('Parsed webhook data:', { callSid, recordingUrl, recordingDuration, from, status })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Log the Twilio message status
    if (callSid) {
      console.log('Logging Twilio message status:', { callSid, status })
      
      const { data: voiceMessage, error: voiceMessageError } = await supabase
        .from('voice_messages')
        .select('id')
        .eq('twilio_sid', callSid)
        .single()

      if (voiceMessageError) {
        console.error('Error finding voice message:', voiceMessageError)
      } else if (voiceMessage) {
        const { error: logError } = await supabase
          .from('twilio_message_logs')
          .insert({
            voice_message_id: voiceMessage.id,
            twilio_sid: callSid,
            status: status || 'unknown'
          })

        if (logError) {
          console.error('Error logging Twilio message status:', logError)
        } else {
          console.log('Successfully logged Twilio message status')
        }
      }
    }

    if (recordingUrl) {
      console.log('Processing recording:', { recordingUrl, callSid, duration: recordingDuration })
      
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
      const auth = btoa(`${accountSid}:${authToken}`)

      console.log('Attempting to download recording from:', `${recordingUrl}.mp3`)

      const recordingResponse = await fetch(`${recordingUrl}.mp3`, {
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      })

      console.log('Twilio recording download response:', {
        status: recordingResponse.status,
        headers: Object.fromEntries(recordingResponse.headers.entries())
      })

      if (!recordingResponse.ok) {
        const errorData = await recordingResponse.text()
        console.error('Twilio API error response:', {
          status: recordingResponse.status,
          body: errorData,
          headers: Object.fromEntries(recordingResponse.headers.entries())
        })
        throw new Error(`Failed to download recording from Twilio. Status: ${recordingResponse.status}`)
      }

      const audioBlob = await recordingResponse.blob()
      console.log('Successfully downloaded recording:', {
        size: audioBlob.size,
        type: audioBlob.type
      })

      const fileName = `${callSid}.mp3`

      console.log('Attempting to upload to Supabase storage:', fileName)

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

      console.log('File uploaded successfully to storage:', uploadData)

      const { data: { publicUrl } } = supabase
        .storage
        .from('voice_messages')
        .getPublicUrl(fileName)

      console.log('Generated public URL:', publicUrl)

      const { data: senderProfile, error: senderError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', from)
        .single()

      if (senderError) {
        console.warn('Could not find user profile:', { phone: from, error: senderError })
      } else {
        console.log('Found user profile:', senderProfile)
      }

      console.log('Creating voice message record...')

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

      console.log('Voice message record created:', messageData)

      // Create a log entry for the new message
      const { error: logError } = await supabase
        .from('twilio_message_logs')
        .insert({
          voice_message_id: messageData.id,
          twilio_sid: callSid,
          status: status || 'recorded'
        })

      if (logError) {
        console.error('Error creating message log:', logError)
      } else {
        console.log('Successfully created message log')
      }

      if (senderProfile?.id) {
        console.log('Processing default recipients for sender:', senderProfile.id)

        const { data: defaultRecipients, error: recipientsError } = await supabase
          .from('voice_message_recipients')
          .select('recipient_id')
          .eq('sender_id', senderProfile.id)
          .eq('is_default', true)

        if (recipientsError) {
          console.error('Error fetching default recipients:', recipientsError)
        } else if (defaultRecipients?.length > 0) {
          console.log('Found default recipients:', defaultRecipients.length)

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
            console.log('Successfully added default recipients')
          }
        }
      }

      console.log('Recording processing completed successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Recording processed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (status === 'ringing') {
      console.log('Handling incoming call, generating TwiML response')

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

    console.log('Webhook processed successfully')
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
    })
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

