# Edge Function Environment Variables Check

## Required Environment Variables

The voice-message-notification edge function requires these environment variables:

1. **N8N_WEBHOOK_URL** - The webhook URL from your n8n workflow
2. **N8N_AUTH_TOKEN** (optional) - Authentication token for n8n
3. **APP_BASE_URL** - Your app's base URL (e.g., https://voice-messenger-haven.vercel.app)

## How to Check in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Click on **voice-message-notification** function
4. Click on **Secrets** tab
5. Check if these variables are set:
   - N8N_WEBHOOK_URL
   - N8N_AUTH_TOKEN
   - APP_BASE_URL

## How to Set Missing Variables

If any are missing, add them:

```bash
# Example values - replace with your actual values
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
N8N_AUTH_TOKEN=your-secret-token
APP_BASE_URL=https://voice-messenger-haven.vercel.app
```

In the Supabase Dashboard:
1. Click "Add Secret"
2. Enter the name and value
3. Click "Save"

## Verify in Code

The edge function should have access to these via:
- `Deno.env.get('N8N_WEBHOOK_URL')`
- `Deno.env.get('N8N_AUTH_TOKEN')`
- `Deno.env.get('APP_BASE_URL')` 