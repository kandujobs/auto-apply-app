-- Add resume-related columns to the existing profiles table
-- Run this SQL to update your profiles table with the missing columns

-- Add resume_url field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Add resume_filename field to store the original filename
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_filename TEXT;

-- Add resume_file_size field to store file size in bytes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_file_size BIGINT;

-- Add resume_file_type field to store MIME type
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_file_type TEXT;

-- Add resume_uploaded_at field to track when resume was uploaded
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'resume_%'
ORDER BY column_name; 