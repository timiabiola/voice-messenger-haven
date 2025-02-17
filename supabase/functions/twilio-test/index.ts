
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Generate test message statuses
    const statuses = ['delivered', 'failed', 'undelivered']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    // Generate test error codes for failed messages
    let errorCode = null
    let errorMessage = null
    
    if (status === 'failed') {
      const errorScenarios = [
        { code: '30001', message: 'Network connectivity issue' },
        { code: '30101', message: 'Invalid recipient number' },
        { code: '30201', message: 'Message content rejected' },
        { code: '30301', message: 'Rate limit exceeded' }
      ]
      const errorIndex = Math.floor(Math.random() * errorScenarios.length)
      errorCode = errorScenarios[errorIndex].code
      errorMessage = errorScenarios[errorIndex].message
    }

    // Create test message log
    const { data, error } = await supabase
      .from('twilio_message_logs')
      .insert({
        twilio_sid: `TEST_${Date.now()}`,
        status,
        error_code: errorCode,
        error_message: errorMessage,
        attempt: 1
      })
      .select()
      .single()

    if (error) throw error

    // Log test execution
    console.log('Test message created:', {
      status,
      errorCode,
      errorMessage,
      messageId: data.id
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test message created',
        data
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    console.error('Test execution error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
