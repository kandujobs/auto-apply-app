-- Enable RLS on all relevant tables and set up policies
-- This file should be run after the main schema is created

-- 1. Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Enable RLS on job_applications table
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Job applications policies
CREATE POLICY "Users can view own job applications" ON job_applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job applications" ON job_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job applications" ON job_applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job applications" ON job_applications
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Enable RLS on job_swipes table
ALTER TABLE job_swipes ENABLE ROW LEVEL SECURITY;

-- Job swipes policies
CREATE POLICY "Users can view own job swipes" ON job_swipes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job swipes" ON job_swipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job swipes" ON job_swipes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job swipes" ON job_swipes
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Enable RLS on jobs table (for employer-created jobs)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Jobs policies - employers can manage their own jobs
CREATE POLICY "Employers can view own jobs" ON jobs
    FOR SELECT USING (auth.uid() = employer_id);

CREATE POLICY "Employers can insert own jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update own jobs" ON jobs
    FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete own jobs" ON jobs
    FOR DELETE USING (auth.uid() = employer_id);

-- Allow public to view open jobs
CREATE POLICY "Public can view open jobs" ON jobs
    FOR SELECT USING (status = 'Open');

-- 5. Enable RLS on user_essential_questions table
ALTER TABLE user_essential_questions ENABLE ROW LEVEL SECURITY;

-- User essential questions policies
CREATE POLICY "Users can view own essential questions" ON user_essential_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own essential questions" ON user_essential_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own essential questions" ON user_essential_questions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own essential questions" ON user_essential_questions
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Enable RLS on employer_essential_questions table
ALTER TABLE employer_essential_questions ENABLE ROW LEVEL SECURITY;

-- Employer essential questions policies
CREATE POLICY "Employers can view own essential questions" ON employer_essential_questions
    FOR SELECT USING (auth.uid() = employer_id);

CREATE POLICY "Employers can insert own essential questions" ON employer_essential_questions
    FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update own essential questions" ON employer_essential_questions
    FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete own essential questions" ON employer_essential_questions
    FOR DELETE USING (auth.uid() = employer_id);

-- 7. Enable RLS on resume_uploads table (if not already done)
ALTER TABLE resume_uploads ENABLE ROW LEVEL SECURITY;

-- Resume uploads policies
CREATE POLICY "Users can view own resume uploads" ON resume_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume uploads" ON resume_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume uploads" ON resume_uploads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume uploads" ON resume_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Enable RLS on resume_parsing_results table (if not already done)
ALTER TABLE resume_parsing_results ENABLE ROW LEVEL SECURITY;

-- Resume parsing results policies
CREATE POLICY "Users can view own parsing results" ON resume_parsing_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parsing results" ON resume_parsing_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parsing results" ON resume_parsing_results
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own parsing results" ON resume_parsing_results
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Enable RLS on education table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'education') THEN
        EXECUTE 'ALTER TABLE education ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "Users can view own education" ON education FOR SELECT USING (auth.uid() = profile_id)';
        EXECUTE 'CREATE POLICY "Users can insert own education" ON education FOR INSERT WITH CHECK (auth.uid() = profile_id)';
        EXECUTE 'CREATE POLICY "Users can update own education" ON education FOR UPDATE USING (auth.uid() = profile_id)';
        EXECUTE 'CREATE POLICY "Users can delete own education" ON education FOR DELETE USING (auth.uid() = profile_id)';
    END IF;
END $$;

-- 10. Enable RLS on experience table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'experience') THEN
        EXECUTE 'ALTER TABLE experience ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "Users can view own experience" ON experience FOR SELECT USING (auth.uid() = profile_id)';
        EXECUTE 'CREATE POLICY "Users can insert own experience" ON experience FOR INSERT WITH CHECK (auth.uid() = profile_id)';
        EXECUTE 'CREATE POLICY "Users can update own experience" ON experience FOR UPDATE USING (auth.uid() = profile_id)';
        EXECUTE 'CREATE POLICY "Users can delete own experience" ON experience FOR DELETE USING (auth.uid() = profile_id)';
    END IF;
END $$;

-- 11. Enable RLS on employers table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employers') THEN
        EXECUTE 'ALTER TABLE employers ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "Employers can view own data" ON employers FOR SELECT USING (auth.uid() = id)';
        EXECUTE 'CREATE POLICY "Employers can insert own data" ON employers FOR INSERT WITH CHECK (auth.uid() = id)';
        EXECUTE 'CREATE POLICY "Employers can update own data" ON employers FOR UPDATE USING (auth.uid() = id)';
        EXECUTE 'CREATE POLICY "Employers can delete own data" ON employers FOR DELETE USING (auth.uid() = id)';
    END IF;
END $$;

-- 12. Enable RLS on roadmaps table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roadmaps') THEN
        EXECUTE 'ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "Users can view own roadmaps" ON roadmaps FOR SELECT USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can insert own roadmaps" ON roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can update own roadmaps" ON roadmaps FOR UPDATE USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can delete own roadmaps" ON roadmaps FOR DELETE USING (auth.uid() = user_id)';
    END IF;
END $$;

-- 13. Enable RLS on roadmap_nodes table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roadmap_nodes') THEN
        EXECUTE 'ALTER TABLE roadmap_nodes ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "Users can view own roadmap nodes" ON roadmap_nodes FOR SELECT USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can insert own roadmap nodes" ON roadmap_nodes FOR INSERT WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can update own roadmap nodes" ON roadmap_nodes FOR UPDATE USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can delete own roadmap nodes" ON roadmap_nodes FOR DELETE USING (auth.uid() = user_id)';
    END IF;
END $$;

-- Note: This script enables RLS on all relevant tables and creates appropriate policies
-- Users can only access their own data, and employers can only access their own jobs
-- Public access is allowed for viewing open jobs 