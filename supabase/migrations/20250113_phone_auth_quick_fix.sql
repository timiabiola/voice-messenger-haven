-- Quick fix for phone authentication issues
-- This script directly updates auth.users to mark phones as confirmed

-- First, let's see what needs to be fixed
SELECT 
  COUNT(*) as users_needing_fix,
  COUNT(CASE WHEN au.phone IS NULL THEN 1 END) as missing_phone,
  COUNT(CASE WHEN au.phone_confirmed_at IS NULL THEN 1 END) as unconfirmed_phone
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.phone IS NOT NULL AND p.phone != '';

-- Update auth.users to sync phones from profiles and mark as confirmed
UPDATE auth.users au
SET 
  phone = CASE 
    WHEN p.phone LIKE '+%' THEN p.phone
    WHEN LENGTH(regexp_replace(p.phone, '[^0-9]', '', 'g')) = 11 
      AND substring(regexp_replace(p.phone, '[^0-9]', '', 'g'), 1, 1) = '1' 
      THEN '+' || regexp_replace(p.phone, '[^0-9]', '', 'g')
    WHEN LENGTH(regexp_replace(p.phone, '[^0-9]', '', 'g')) = 10 
      THEN '+1' || regexp_replace(p.phone, '[^0-9]', '', 'g')
    ELSE '+' || regexp_replace(p.phone, '[^0-9]', '', 'g')
  END,
  phone_confirmed_at = COALESCE(au.phone_confirmed_at, NOW()),
  updated_at = NOW()
FROM profiles p
WHERE au.id = p.id
  AND p.phone IS NOT NULL 
  AND p.phone != ''
  AND (au.phone IS NULL OR au.phone = '' OR au.phone_confirmed_at IS NULL);

-- Show the results
SELECT 
  COUNT(*) as total_users_with_phones,
  COUNT(CASE WHEN au.phone_confirmed_at IS NOT NULL THEN 1 END) as confirmed_phones,
  COUNT(CASE WHEN au.phone_confirmed_at IS NULL THEN 1 END) as unconfirmed_phones
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE p.phone IS NOT NULL AND p.phone != '';

-- Create a simple view to monitor phone status
CREATE OR REPLACE VIEW phone_auth_status AS
SELECT 
  p.id as user_id,
  p.email,
  p.phone as profile_phone,
  au.phone as auth_phone,
  au.phone_confirmed_at,
  CASE 
    WHEN p.phone IS NULL OR p.phone = '' THEN 'No phone'
    WHEN au.phone IS NULL THEN 'Not synced'
    WHEN au.phone_confirmed_at IS NULL THEN 'Not confirmed'
    ELSE 'OK'
  END as status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY status, p.email;

-- Grant access to the view
GRANT SELECT ON phone_auth_status TO authenticated;

-- Show any remaining issues
SELECT * FROM phone_auth_status WHERE status != 'OK' AND status != 'No phone'; 