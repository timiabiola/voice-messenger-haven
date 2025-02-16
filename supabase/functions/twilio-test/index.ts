
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Twilio test function was invoked");  // 1. Confirm invocation
  console.log("Request URL:", req.url); // Log the actual URL being hit
  console.log("Request method:", req.method); // Log the HTTP method
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check environment variables first
    console.log("Checking environment variables..."); // 2. Environment check
    console.log("TWILIO_ACCOUNT_SID is", Deno.env.get("TWILIO_ACCOUNT_SID") ? "present" : "missing");
    console.log("TWILIO_AUTH_TOKEN is", Deno.env.get("TWILIO_AUTH_TOKEN") ? "present" : "missing");
    
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
    
    if (!accountSid || !authToken) {
      const errorDetails = {
        accountSid: accountSid ? "present" : "missing",
        authToken: authToken ? "present" : "missing",
        envKeys: Object.keys(Deno.env.toObject()) // Log available environment keys
      };
      console.error("Missing Twilio credentials. Environment details:", errorDetails);
      throw new Error('Missing Twilio credentials. Check Edge Function configuration.')
    }

    console.log("Credentials loaded successfully"); // 3. Credentials loaded

    // Build basic authentication header
    const auth = btoa(`${accountSid}:${authToken}`)

    // Twilio API URL for listing recordings (a simple GET request)
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings.json`

    console.log('Preparing to send request to Twilio API:', { url }); // 4. Pre-request
    console.log('Request headers:', {
      Authorization: 'Basic ' + auth.substring(0, 5) + '...', // Log partial auth for safety
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }
    })

    // Log response status and headers for debugging
    console.log("Twilio API response status:", response.status); // 5. Response received
    console.log("Twilio API response headers:", Object.fromEntries(response.headers.entries()));

    // Attempt to parse response JSON
    const data = await response.json()
    console.log("Twilio API response data:", data); // 6. Response parsed

    if (!response.ok) {
      // Twilio returned an error; log it for further diagnosis
      console.error("Twilio API error response:", { 
        status: response.status,
        statusText: response.statusText,
        data 
      });
      throw new Error(`Twilio API error: ${response.status} - ${data?.message || 'Unknown error'}`)
    }

    console.log("Successfully processed Twilio API response"); // 7. Success
    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        environment: {
          hasTwilioAccountSid: !!accountSid,
          hasTwilioAuthToken: !!authToken
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Detailed error in test endpoint:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      endpoint: req.url,
      method: req.method
    });
    return new Response(
      JSON.stringify({ 
        error: error.message,
        endpoint: req.url,
        method: req.method
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
