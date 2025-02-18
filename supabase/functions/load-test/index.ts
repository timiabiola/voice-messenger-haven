
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
  remainingRequests?: number;
}

Deno.serve(async (req) => {
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

      // Create initial test record
      const { data: testRecord, error: insertError } = await supabase
        .from('load_test_results')
        .insert({
          start_time: new Date().toISOString(),
          config,
          status: 'running',
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create test record: ${insertError.message}`)
      }

      const rateLimits: RateLimitInfo[] = []

      try {
        // Simulate concurrent users
        const userPromises = Array(config.concurrentUsers).fill(null).map(async (_, userIndex) => {
          for (let i = 0; i < config.requestsPerUser; i++) {
            try {
              const response = await fetch(`${supabaseUrl}/rest/v1/messages`, {
                headers: {
                  'Authorization': `Bearer ${supabaseKey}`,
                  'apikey': supabaseKey,
                },
              })

              const remainingRequests = response.headers.get('x-ratelimit-remaining')
              
              rateLimits.push({
                timestamp: new Date().toISOString(),
                endpoint: '/messages',
                requests: i + 1,
                statusCode: response.status,
                remainingRequests: remainingRequests ? parseInt(remainingRequests) : undefined
              })

              console.log(`User ${userIndex} - Request ${i + 1} - Remaining requests: ${remainingRequests}`)

              if (remainingRequests && parseInt(remainingRequests) < 10) {
                console.log('Rate limit approaching, adding delay')
                await new Promise(resolve => setTimeout(resolve, 1000))
              }

            } catch (error) {
              console.error(`Error in request: ${error.message}`)
              rateLimits.push({
                timestamp: new Date().toISOString(),
                endpoint: '/messages',
                requests: i + 1,
                statusCode: 500
              })
            }

            if (i < config.requestsPerUser - 1) {
              await new Promise(resolve => setTimeout(resolve, config.delayBetweenRequests))
            }
          }
        })

        await Promise.all(userPromises)
        
        // Update test record as completed
        const { error: updateError } = await supabase
          .from('load_test_results')
          .update({
            end_time: new Date().toISOString(),
            status: 'completed',
            rate_limits: rateLimits
          })
          .eq('id', testRecord.id)

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Load test completed successfully',
            testId: testRecord.id,
            rateLimits,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      } catch (error) {
        // Update test record as failed
        await supabase
          .from('load_test_results')
          .update({
            end_time: new Date().toISOString(),
            status: 'failed',
            error_message: error.message,
            rate_limits: rateLimits
          })
          .eq('id', testRecord.id)

        throw error
      }
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
