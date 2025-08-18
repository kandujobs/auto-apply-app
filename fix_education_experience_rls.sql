-- Fix RLS policies for education and experience tables
-- This ensures users can properly save their education and experience data

-- Enable RLS on education table if not already enabled
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

-- Enable RLS on experience table if not already enabled
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own education" ON education;
DROP POLICY IF EXISTS "Users can update own education" ON education;
DROP POLICY IF EXISTS "Users can insert own education" ON education;
DROP POLICY IF EXISTS "Users can delete own education" ON education;
DROP POLICY IF EXISTS "Service role can access all education" ON education;

DROP POLICY IF EXISTS "Users can view own experience" ON experience;
DROP POLICY IF EXISTS "Users can update own experience" ON experience;
DROP POLICY IF EXISTS "Users can insert own experience" ON experience;
DROP POLICY IF EXISTS "Users can delete own experience" ON experience;
DROP POLICY IF EXISTS "Service role can access all experience" ON experience;

-- Create comprehensive policies for education table
CREATE POLICY "Users can view own education" ON education
    FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own education" ON education
    FOR UPDATE
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own education" ON education
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own education" ON education
    FOR DELETE
    USING (auth.uid() = profile_id);

CREATE POLICY "Service role can access all education" ON education
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create comprehensive policies for experience table
CREATE POLICY "Users can view own experience" ON experience
    FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own experience" ON experience
    FOR UPDATE
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own experience" ON experience
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own experience" ON experience
    FOR DELETE
    USING (auth.uid() = profile_id);

CREATE POLICY "Service role can access all experience" ON experience
    FOR ALL
    USING (auth.role() = 'service_role');

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('education', 'experience')
ORDER BY tablename, policyname;
