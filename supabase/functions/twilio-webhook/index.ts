
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Twilio } from 'https://esm.sh/twilio@4.19.0'

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

    // Initialize Twilio client
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!
    const client = new Twilio(accountSid, authToken)

    if (recordingUrl) {
      console.log('Processing recording:', { recordingUrl, callSid, duration: recordingDuration })
      
      // Download recording from Twilio
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

      // Create or update voice message record
      const { error: dbError } = await supabase
        .from('voice_messages')
        .upsert({
          id: callSid,
          audio_url: publicUrl,
          duration: parseInt(recordingDuration as string) || 0,
          phone_number: from as string,
          twilio_sid: callSid as string,
          twilio_status: status as string,
          updated_at: new Date().toISOString()
        })

      if (dbError) {
        throw new Error(`Failed to update database: ${dbError.message}`)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Recording processed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle incoming calls
    if (status === 'ringing') {
      const twiml = new Twilio.twiml.VoiceResponse()
      twiml.say('Please leave your message after the beep.')
      twiml.record({
        action: req.url, // Send recording webhook to the same endpoint
        transcribe: false,
        maxLength: 300,
        playBeep: true,
        trim: 'trim-silence'
      })

      return new Response(twiml.toString(), {
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
