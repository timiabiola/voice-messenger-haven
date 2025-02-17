
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

    // Parse request body
    const body = await req.text()
    const params = new URLSearchParams(body)
    
    // Validate Twilio signature
    if (!await validateTwilioSignature(req, body)) {
      console.error('Invalid Twilio signature')
      return new Response('Unauthorized', { status: 401 })
    }

    // Extract message details
    const messageStatus = params.get('MessageStatus')
    const messageSid = params.get('MessageSid')
    const errorCode = params.get('ErrorCode')

    // Insert webhook data
    const { data, error } = await supabase
      .from('twilio_message_logs')
      .insert({
        twilio_sid: messageSid,
        status: messageStatus,
        error_code: errorCode,
        error_category: errorCode ? categorizeError(errorCode) : null,
        attempt: 1,
        retryable: true
      })
      .select()
      .single()

    if (error) throw error

    console.log('Webhook processed:', {
      status: messageStatus,
      sid: messageSid,
      errorCode,
      data
    })

    return new Response(JSON.stringify({ success: true }), {
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
