import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { format, toZonedTime } from "https://esm.sh/date-fns-tz@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { record, type } = await req.json()
    
    // Only process INSERT events
    if (type !== 'INSERT') {
      return new Response(JSON.stringify({ message: 'Not an insert event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Processing notification for message:', record.id)

    // Fetch recipient details
    const { data: recipients, error: recipientsError } = await supabaseClient
      .from('voice_message_recipients')
      .select('recipient_id')
      .eq('voice_message_id', record.id)

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError)
      throw recipientsError
    }

    console.log(`Found ${recipients?.length || 0} recipients`)

    for (const recipient of recipients || []) {
      try {
        // Fetch user profile and preferences
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', recipient.recipient_id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          continue
        }

        if (!profile || profile.notification_preference === 'none') {
          console.log(`Skipping notification for user ${recipient.recipient_id} - preference is none`)
          continue
        }

        // Validate contact info based on preference
        if ((profile.notification_preference === 'sms' || profile.notification_preference === 'both') && !profile.phone) {
          console.warn(`User ${recipient.recipient_id} prefers SMS but has no phone number`)
          if (profile.notification_preference === 'sms' && profile.email) {
            // Fallback to email if SMS is preferred but no phone
            profile.notification_preference = 'email'
          } else if (profile.notification_preference === 'sms') {
            continue // Skip if no fallback available
          }
        }

        if ((profile.notification_preference === 'email' || profile.notification_preference === 'both') && !profile.email) {
          console.warn(`User ${recipient.recipient_id} prefers email but has no email address`)
          if (profile.notification_preference === 'email') {
            continue // Skip if no email available
          }
        }

        // Fetch sender info
        const { data: sender } = await supabaseClient
          .from('profiles')
          .select('first_name')
          .eq('id', record.sender_id)
          .single()

        // Convert to Mountain Time
        const mtTime = toZonedTime(new Date(record.created_at), 'America/Edmonton')
        const formattedTime = format(mtTime, 'MMM d, h:mm a zzz')

        // Format duration
        const minutes = Math.floor(record.duration / 60)
        const seconds = record.duration % 60
        const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

        // Prepare notification payload
        const payload = {
          notificationType: profile.notification_preference,
          recipientPhone: profile.phone,
          recipientEmail: profile.email,
          recipientFirstName: profile.first_name || 'there',
          senderFirstName: sender?.first_name || 'Someone',
          messageTimestamp: formattedTime,
          messageId: record.id,
          messageDuration: durationText,
          appUrl: `${Deno.env.get('APP_BASE_URL') || 'https://voice-messenger-haven.vercel.app'}/inbox?message=${record.id}`
        }

        console.log('Sending notification payload:', { ...payload, recipientPhone: '***', recipientEmail: '***' })

        // Send to n8n webhook
        const n8nUrl = Deno.env.get('N8N_WEBHOOK_URL')
        const n8nToken = Deno.env.get('N8N_AUTH_TOKEN')

        if (!n8nUrl) {
          throw new Error('N8N_WEBHOOK_URL not configured')
        }

        const response = await fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(n8nToken ? { 'Authorization': `Bearer ${n8nToken}` } : {})
          },
          body: JSON.stringify(payload)
        })

        const responseText = await response.text()
        console.log('n8n response:', response.status, responseText)

        // Log notification attempt
        const { error: logError } = await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: recipient.recipient_id,
            message_id: record.id,
            notification_type: profile.notification_preference === 'both' ? 'sms' : profile.notification_preference,
            recipient_contact: profile.notification_preference === 'email' ? profile.email : profile.phone,
            status: response.ok ? 'sent' : 'failed',
            error_message: response.ok ? null : responseText
          })

        if (logError) {
          console.error('Error logging notification:', logError)
        }

        // If notification preference is 'both', send a second notification
        if (profile.notification_preference === 'both' && response.ok) {
          // Log the email notification separately
          await supabaseClient
            .from('notification_logs')
            .insert({
              user_id: recipient.recipient_id,
              message_id: record.id,
              notification_type: 'email',
              recipient_contact: profile.email,
              status: 'sent'
            })
        }

      } catch (recipientError) {
        console.error(`Error processing recipient ${recipient.recipient_id}:`, recipientError)
        
        // Log failed attempt
        await supabaseClient
          .from('notification_logs')
          .insert({
            user_id: recipient.recipient_id,
            message_id: record.id,
            notification_type: 'sms', // default
            recipient_contact: null,
            status: 'failed',
            error_message: recipientError.message
          })
      }
    }

    return new Response(JSON.stringify({ success: true, processed: recipients?.length || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 