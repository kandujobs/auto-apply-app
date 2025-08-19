-- Add onboarding_complete field to profiles table
-- This field tracks whether a user has completed the onboarding process

-- Add onboarding_complete field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Add onboarding_complete field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Update existing profiles to mark them as onboarding complete if they have basic info
UPDATE profiles 
SET onboarding_complete = TRUE 
WHERE name IS NOT NULL 
  AND name != '' 
  AND (resume_url IS NOT NULL OR (education IS NOT NULL AND jsonb_array_length(education) > 0));

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'onboarding_complete';
