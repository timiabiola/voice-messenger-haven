
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Load Twilio credentials from environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
    
    if (!accountSid || !authToken) {
      throw new Error('Missing Twilio credentials')
    }

    // Build basic authentication header
    const auth = btoa(`${accountSid}:${authToken}`)

    // Twilio API URL for listing recordings (a simple GET request)
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings.json`

    console.log('Making test request to Twilio API')

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }
    })

    // Log response status for debugging
    console.log("Response status:", response.status)

    // Attempt to parse response JSON
    const data = await response.json()
    console.log("Response data:", data)

    if (!response.ok) {
      // Twilio returned an error; log it for further diagnosis
      console.error("Twilio API error:", data)
      throw new Error(`Twilio API error: ${response.status}`)
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error in test endpoint:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
