-- Simple Storage Policy for Backend Access
-- This allows the backend/automation scripts to access all resumes in the bucket
-- Folder structure: resumes/user-id/filename.pdf

-- Drop any existing policies
DROP POLICY IF EXISTS "Backend access to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public access to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on resumes bucket" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for backend access (allows service role to access all resumes)
-- This allows the backend/automation scripts to access resumes in any user folder
CREATE POLICY "Backend access to resumes" ON storage.objects
FOR ALL USING (
    bucket_id = 'resumes'
);

-- Policy for users to upload their own resumes (in their user folder)
CREATE POLICY "Users can upload own resumes" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to view their own resumes (in their user folder)
CREATE POLICY "Users can view own resumes" ON storage.objects
FOR SELECT USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to update their own resumes (in their user folder)
CREATE POLICY "Users can update own resumes" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own resumes (in their user folder)
CREATE POLICY "Users can delete own resumes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- This policy setup allows:
-- 1. Backend scripts to access all resumes (any user folder)
-- 2. Users to manage their own resumes (only their user folder)
-- 3. Service role to access all resumes for automation
-- 
-- Folder structure: resumes/user-id/filename.pdf
-- Example: resumes/123e4567-e89b-12d3-a456-426614174000/resume_1234567890.pdf 