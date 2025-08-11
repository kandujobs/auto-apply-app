-- Disable RLS on storage.objects for the resumes bucket
-- This allows public access to resume files without authentication

-- First, drop any existing policies for the resumes bucket
DROP POLICY IF EXISTS "Users can upload own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Public access to resumes" ON storage.objects;

-- Disable RLS for the resumes bucket specifically
-- This allows anyone to upload/view files in the resumes bucket
CREATE POLICY "Allow all operations on resumes bucket" ON storage.objects
FOR ALL USING (bucket_id = 'resumes');

-- Alternative: If you want to keep RLS enabled but allow public access, use these policies instead:
-- (Uncomment the following if you prefer to keep RLS enabled)

-- CREATE POLICY "Allow public upload to resumes" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'resumes');

-- CREATE POLICY "Allow public view of resumes" ON storage.objects
-- FOR SELECT USING (bucket_id = 'resumes');

-- CREATE POLICY "Allow public update of resumes" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'resumes');

-- CREATE POLICY "Allow public delete of resumes" ON storage.objects
-- FOR DELETE USING (bucket_id = 'resumes');

-- Note: The above policy "Allow all operations on resumes bucket" 
-- effectively disables RLS for the resumes bucket while keeping it enabled for other buckets 