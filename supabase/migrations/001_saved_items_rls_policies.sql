-- Enable RLS on saved_items table if not already enabled
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view their own saved items" ON saved_items;
DROP POLICY IF EXISTS "Users can insert their own saved items" ON saved_items;
DROP POLICY IF EXISTS "Users can update their own saved items" ON saved_items;
DROP POLICY IF EXISTS "Users can delete their own saved items" ON saved_items;

-- Create SELECT policy
CREATE POLICY "Users can view their own saved items"
ON saved_items
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create INSERT policy
CREATE POLICY "Users can insert their own saved items"
ON saved_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy
CREATE POLICY "Users can update their own saved items"
ON saved_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create DELETE policy (for soft delete via deleted_at)
CREATE POLICY "Users can delete their own saved items"
ON saved_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
