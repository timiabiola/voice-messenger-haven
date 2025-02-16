
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Twilio test function was invoked");  // 1. Confirm invocation
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Loading Twilio credentials..."); // 2. Credential loading
    // Load Twilio credentials from environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
    
    if (!accountSid || !authToken) {
      console.error("Missing Twilio credentials:", { accountSid: !!accountSid, authToken: !!authToken });
      throw new Error('Missing Twilio credentials')
    }

    console.log("Credentials loaded successfully"); // 3. Credentials loaded

    // Build basic authentication header
    const auth = btoa(`${accountSid}:${authToken}`)

    // Twilio API URL for listing recordings (a simple GET request)
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings.json`

    console.log('Preparing to send request to Twilio API:', { url }); // 4. Pre-request

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }
    })

    // Log response status for debugging
    console.log("Twilio API response status:", response.status); // 5. Response received

    // Attempt to parse response JSON
    const data = await response.json()
    console.log("Twilio API response data:", data); // 6. Response parsed

    if (!response.ok) {
      // Twilio returned an error; log it for further diagnosis
      console.error("Twilio API error response:", { status: response.status, data });
      throw new Error(`Twilio API error: ${response.status}`)
    }

    console.log("Successfully processed Twilio API response"); // 7. Success
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Detailed error in test endpoint:", {
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
