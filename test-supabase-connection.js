import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Connection error:', error.message)
      console.error('Error details:', error)
    } else {
      console.log('✅ Connection successful!')
      console.log('Profiles table exists and is accessible')
    }
  } catch (e) {
    console.error('Unexpected error:', e)
  }
}

testConnection()
