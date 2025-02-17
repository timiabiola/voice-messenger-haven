import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Rate limiting map
const rateLimits = new Map<string, { count: number; timestamp: number }>()

// Verify Twilio request signature
async function validateTwilioSignature(request: Request, body: string): Promise<boolean> {
  const signature = request.headers.get('X-Twilio-Signature')
  if (!signature) return false

  const url = new URL(request.url)
  const fullUrl = `${url.protocol}//${url.host}${url.pathname}`
  
  // Sort POST parameters alphabetically
  const sortedParams = Object.fromEntries(
    new URLSearchParams(body)
      .toString()
      .split('&')
      .sort()
      .map(p => p.split('=').map(decodeURIComponent))
  )

  // Create validation string
  const validationString = fullUrl + Object.entries(sortedParams)
    .map(([k, v]) => k + v)
    .join('')

  // Generate HMAC signature
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(twilioAuthToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  )

  const signature_bytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(validationString)
  )

  const calculated_signature = btoa(
    String.fromCharCode(...new Uint8Array(signature_bytes))
  )

  return calculated_signature === signature
}

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimits.get(ip)
  
  if (!limit) {
    rateLimits.set(ip, { count: 1, timestamp: now })
    return true
  }

  // Reset counter if window has passed (1 minute)
  if (now - limit.timestamp > 60000) {
    rateLimits.set(ip, { count: 1, timestamp: now })
    return true
  }

  // Increment counter if within window
  if (limit.count < 100) { // Allow 100 requests per minute
    rateLimits.set(ip, { count: limit.count + 1, timestamp: limit.timestamp })
    return true
  }

  return false
}

// Map Twilio error codes to categories
function categorizeError(errorCode: string): string {
  const networkErrors = ['30001', '30002', '30003', '30004', '30005']
  const recipientErrors = ['30006', '30007', '30008']
  const contentErrors = ['30009', '30010']
  const quotaErrors = ['30011', '30012']
  
  if (networkErrors.includes(errorCode)) return 'network'
  if (recipientErrors.includes(errorCode)) return 'recipient'
  if (contentErrors.includes(errorCode)) return 'content'
  if (quotaErrors.includes(errorCode)) return 'quota'
  return 'unknown'
}

async function handleTwilioUpdate(body: URLSearchParams) {
  const messageStatus = body.get('MessageStatus')
  const messageSid = body.get('MessageSid')
  const errorCode = body.get('ErrorCode')

  // Fetch error mapping if error code exists
  let errorMapping = null
  if (errorCode) {
    const { data: mapping } = await supabase
      .from('twilio_error_mapping')
      .select('*')
      .eq('error_code', errorCode)
      .single()
    errorMapping = mapping
  }

  // Insert webhook data
  const { data, error } = await supabase
    .from('twilio_message_logs')
    .insert({
      twilio_sid: messageSid,
      status: messageStatus,
      error_code: errorCode,
      error_category: errorMapping?.category || 'unknown',
      attempt: 1,
      retryable: errorMapping?.retry_strategy !== null
    })
    .select()
    .single()

  if (error) throw error

  // Check for alerts
  const { data: alerts } = await supabase
    .from('delivery_alerts')
    .select('*')

  for (const alert of alerts || []) {
    // Execute alert condition
    const { data: matches } = await supabase.rpc('check_alert_condition', {
      condition: alert.condition,
      alert_context: {
        error_category: errorMapping?.category,
        retry_count: data.retry_count,
        status: messageStatus
      }
    })

    if (matches) {
      console.log('Alert triggered:', {
        alert: alert.alert_name,
        message: alert.message_template
          .replace('{failure_rate}', '0')
          .replace('{usage_count}', '0')
          .replace('{retry_count}', data.retry_count?.toString() || '0')
      })
    }
  }

  return data
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature',
      }
    })
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('CF-Connecting-IP') || 'unknown'
    if (!checkRateLimit(clientIP)) {
      return new Response('Too Many Requests', { status: 429 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)
    
    if (!await validateTwilioSignature(req, body)) {
      console.error('Invalid Twilio signature')
      return new Response('Unauthorized', { status: 401 })
    }

    const result = await handleTwilioUpdate(params)

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
