
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const messageStatus = formData.get('MessageStatus')
    const messageSid = formData.get('MessageSid')
    const errorCode = formData.get('ErrorCode')
    const errorMessage = formData.get('ErrorMessage')

    // Get the client's IP address for rate limiting
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown'

    // Check rate limits
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .from('webhook_rate_limits')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('endpoint', '/twilio-webhook')
      .single()

    if (rateLimitError && rateLimitError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Rate limit check error:', rateLimitError)
      throw new Error('Failed to check rate limits')
    }

    const now = new Date()
    if (rateLimitData) {
      const windowStart = new Date(rateLimitData.window_start)
      if ((now.getTime() - windowStart.getTime()) < 60000) { // 1 minute window
        if (rateLimitData.request_count >= 100) { // 100 requests per minute limit
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded' }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
        // Update counter
        await supabase
          .from('webhook_rate_limits')
          .update({ request_count: rateLimitData.request_count + 1 })
          .eq('id', rateLimitData.id)
      } else {
        // Reset window
        await supabase
          .from('webhook_rate_limits')
          .update({ 
            window_start: now.toISOString(),
            request_count: 1
          })
          .eq('id', rateLimitData.id)
      }
    } else {
      // Create new rate limit record
      await supabase
        .from('webhook_rate_limits')
        .insert({
          ip_address: ipAddress,
          endpoint: '/twilio-webhook',
          window_start: now.toISOString(),
          request_count: 1
        })
    }

    // Determine error category if there's an error
    let errorCategory = null
    if (errorCode) {
      // Map Twilio error codes to our categories
      // See: https://www.twilio.com/docs/api/errors
      const code = parseInt(errorCode)
      if (code >= 30000 && code <= 30099) errorCategory = 'network'
      else if (code >= 30100 && code <= 30199) errorCategory = 'recipient'
      else if (code >= 30200 && code <= 30299) errorCategory = 'content'
      else if (code >= 30300 && code <= 30399) errorCategory = 'quota'
      else errorCategory = 'unknown'
    }

    // Log the status update
    const { error: logError } = await supabase
      .from('twilio_message_logs')
      .insert({
        twilio_sid: messageSid,
        status: messageStatus,
        error_message: errorMessage,
        error_category: errorCategory,
        retryable: errorCategory === 'network' || errorCategory === 'quota'
      })

    if (logError) {
      console.error('Error logging message status:', logError)
      throw new Error('Failed to log message status')
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
