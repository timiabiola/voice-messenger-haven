
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  delayBetweenRequests: number;
}

interface RateLimitInfo {
  timestamp: string;
  endpoint: string;
  requests: number;
  statusCode: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    if (req.method === 'POST') {
      const { config } = await req.json() as { config: LoadTestConfig }
      console.log('Starting load test with config:', config)

      const startTime = Date.now()
      const rateLimits: RateLimitInfo[] = []

      // Simulate concurrent users
      const userPromises = Array(config.concurrentUsers).fill(null).map(async (_, userIndex) => {
        for (let i = 0; i < config.requestsPerUser; i++) {
          const requestStart = Date.now()
          
          try {
            const response = await fetch(`${supabaseUrl}/rest/v1/messages`, {
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
              },
            })

            rateLimits.push({
              timestamp: new Date().toISOString(),
              endpoint: '/messages',
              requests: i + 1,
              statusCode: response.status,
            })

            // Log rate limit headers
            const remainingRequests = response.headers.get('x-ratelimit-remaining')
            console.log(`User ${userIndex} - Request ${i + 1} - Remaining requests: ${remainingRequests}`)

            // Respect rate limits
            if (remainingRequests && parseInt(remainingRequests) < 10) {
              console.log('Rate limit approaching, adding delay')
              await new Promise(resolve => setTimeout(resolve, 1000))
            }

          } catch (error) {
            console.error(`Error in request: ${error.message}`)
          }

          // Add delay between requests
          if (i < config.requestsPerUser - 1) {
            await new Promise(resolve => setTimeout(resolve, config.delayBetweenRequests))
          }
        }
      })

      await Promise.all(userPromises)
      
      // Store test results
      const { error } = await supabase
        .from('load_test_results')
        .insert({
          start_time: new Date(startTime).toISOString(),
          end_time: new Date().toISOString(),
          config: config,
          rate_limits: rateLimits,
        })

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Load test completed successfully',
          rateLimits,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in load test:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
