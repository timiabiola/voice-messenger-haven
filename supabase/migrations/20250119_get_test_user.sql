-- Get Test User for SQL Editor Testing
-- Run this first to get a user ID for testing RLS policies

-- Show all available users (limit 10 for safety)
SELECT 
    'Available Users:' as info;

SELECT 
    id as user_id,
    email,
    phone,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Get the most recently active user
SELECT 
    'Most Recently Active User:' as info;

SELECT 
    id as user_id,
    email,
    phone,
    last_sign_in_at
FROM auth.users
WHERE last_sign_in_at IS NOT NULL
ORDER BY last_sign_in_at DESC
LIMIT 1;

-- Check if user has a profile
WITH recent_user AS (
    SELECT id 
    FROM auth.users 
    WHERE last_sign_in_at IS NOT NULL
    ORDER BY last_sign_in_at DESC 
    LIMIT 1
)
SELECT 
    'User Profile Info:' as info,
    p.*
FROM profiles p
JOIN recent_user u ON p.id = u.id;

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== INSTRUCTIONS ===';
    RAISE NOTICE '1. Copy one of the user_id values from above';
    RAISE NOTICE '2. Use it in the verification_with_user_id.sql script';
    RAISE NOTICE '3. This allows testing RLS policies from SQL Editor';
    RAISE NOTICE '';
    RAISE NOTICE 'Example: If user_id is 123e4567-e89b-12d3-a456-426614174000';
    RAISE NOTICE 'Replace test_user_id := auth.uid() with:';
    RAISE NOTICE 'test_user_id := ''123e4567-e89b-12d3-a456-426614174000''::uuid;';
END $$;