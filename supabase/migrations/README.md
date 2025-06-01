# Supabase Migrations

## How to Apply These Migrations

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run each SQL file in order:
   - 001_saved_items_rls_policies.sql
   - 002_voice_messages_rls_policy.sql

## What These Migrations Do

### 001_saved_items_rls_policies.sql
- Enables Row Level Security on the saved_items table
- Creates policies allowing authenticated users to:
  - View their own saved items
  - Insert new saved items
  - Update their own saved items
  - Delete their own saved items

### 002_voice_messages_rls_policy.sql
- Creates a policy allowing users to view voice messages they have access to
- This ensures users can only save messages they can actually access
