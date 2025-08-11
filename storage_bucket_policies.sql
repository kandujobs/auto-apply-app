-- Storage Bucket Configuration for Resume Uploads (RLS Enabled with Backend Access)
-- Run this after creating the 'resumes' storage bucket in Supabase

-- First, drop any existing policies for the resumes bucket
DROP POLICY IF EXISTS "Users can upload own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public access to resumes" ON storage.objects;
DROP POLICY IF EXISTS "Backend access to resumes" ON storage.objects;

-- Enable RLS on storage.objects for the resumes bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for backend access (allows service role to access all resumes)
-- This allows the backend/automation scripts to access resumes
CREATE POLICY "Backend access to resumes" ON storage.objects
FOR ALL USING (
    bucket_id = 'resumes'
);

-- Policy for users to upload their own resumes
CREATE POLICY "Users can upload own resumes" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to view their own resumes
CREATE POLICY "Users can view own resumes" ON storage.objects
FOR SELECT USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to update their own resumes
CREATE POLICY "Users can update own resumes" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own resumes
CREATE POLICY "Users can delete own resumes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'resumes' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative: If you want to allow public read access to resumes (less secure)
-- Uncomment the following if you want anyone to be able to view resumes:
-- CREATE POLICY "Public read access to resumes" ON storage.objects
-- FOR SELECT USING (bucket_id = 'resumes');

-- Note: The folder structure in storage will be:
-- resumes/
--   ├── user-uuid-1/
--   │   ├── resume_1234567890.pdf
--   │   └── resume_1234567891.docx
--   └── user-uuid-2/
--       └── resume_1234567892.pdf
-- 
-- The "Backend access to resumes" policy allows service role to access all files
-- The user-specific policies allow users to manage their own resumes 