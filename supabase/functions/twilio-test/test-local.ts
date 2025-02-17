
const testWebhook = async () => {
  try {
    const response = await fetch('http://localhost:54321/functions/v1/twilio-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-test-token'
      }
    })
    
    const data = await response.json()
    console.log('Test response:', data)
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run test
testWebhook()
