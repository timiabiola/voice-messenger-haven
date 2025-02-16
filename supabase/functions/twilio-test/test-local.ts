
// This is a local test script for Twilio API integration
// Run with: deno run --allow-net --allow-env test-local.ts

// First, log that we're starting
console.log("Starting local Twilio API test...");

// Function to test Twilio API
async function testTwilioAPI() {
  console.log("Testing Twilio API connection...");

  // Check environment variables
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

  console.log("Environment check:");
  console.log("TWILIO_ACCOUNT_SID is", accountSid ? "present" : "missing");
  console.log("TWILIO_AUTH_TOKEN is", authToken ? "present" : "missing");

  if (!accountSid || !authToken) {
    throw new Error("Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.");
  }

  // Build authentication
  const auth = btoa(`${accountSid}:${authToken}`);

  // Test URL - using recordings list as a simple GET request
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings.json`;
  
  console.log("Sending request to:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      }
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status} - ${data?.message || 'Unknown error'}`);
    }

    console.log("Test completed successfully!");
    return data;
  } catch (error) {
    console.error("Test failed:", {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    throw error;
  }
}

// Run the test
console.log("=== Twilio API Local Test ===");
testTwilioAPI()
  .then(result => {
    console.log("✅ Test passed!");
    console.log("Result:", result);
  })
  .catch(error => {
    console.error("❌ Test failed:", error.message);
    Deno.exit(1);
  });
