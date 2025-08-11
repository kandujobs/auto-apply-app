-- Resume Storage Schema for Joint App
-- This file adds resume storage functionality to the existing database

-- 1. Update the profiles table to include resume-related fields
-- (This assumes the profiles table already exists from the existing schema)

-- Add resume_url field to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'resume_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN resume_url TEXT;
    END IF;
END $$;

-- Add resume_uploaded_at field to track when resume was uploaded
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'resume_uploaded_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN resume_uploaded_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add resume_filename field to store the original filename
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'resume_filename'
    ) THEN
        ALTER TABLE profiles ADD COLUMN resume_filename TEXT;
    END IF;
END $$;

-- Add resume_file_size field to store file size in bytes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'resume_file_size'
    ) THEN
        ALTER TABLE profiles ADD COLUMN resume_file_size BIGINT;
    END IF;
END $$;

-- Add resume_file_type field to store MIME type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'resume_file_type'
    ) THEN
        ALTER TABLE profiles ADD COLUMN resume_file_type TEXT;
    END IF;
END $$;

-- 2. Create a resume_uploads table to track upload history
CREATE TABLE IF NOT EXISTS resume_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create a resume_parsing_results table to store parsed resume data
CREATE TABLE IF NOT EXISTS resume_parsing_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES resume_uploads(id) ON DELETE CASCADE,
    parsed_data JSONB NOT NULL,
    raw_text TEXT,
    parsing_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    parsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resume_uploads_user_id ON resume_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_uploaded_at ON resume_uploads(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_resume_uploads_is_current ON resume_uploads(is_current);
CREATE INDEX IF NOT EXISTS idx_resume_parsing_results_user_id ON resume_parsing_results(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_parsing_results_upload_id ON resume_parsing_results(upload_id);
CREATE INDEX IF NOT EXISTS idx_resume_parsing_results_status ON resume_parsing_results(parsing_status);

-- 5. Create a function to update the current resume for a user
CREATE OR REPLACE FUNCTION update_user_current_resume(
    p_user_id UUID,
    p_resume_url TEXT,
    p_filename TEXT,
    p_file_size BIGINT,
    p_file_type TEXT,
    p_storage_path TEXT
) RETURNS VOID AS $$
BEGIN
    -- Set all previous uploads as not current
    UPDATE resume_uploads 
    SET is_current = false 
    WHERE user_id = p_user_id;
    
    -- Insert new upload record
    INSERT INTO resume_uploads (
        user_id, 
        filename, 
        file_size, 
        file_type, 
        storage_path, 
        public_url,
        is_current
    ) VALUES (
        p_user_id, 
        p_filename, 
        p_file_size, 
        p_file_type, 
        p_storage_path, 
        p_resume_url,
        true
    );
    
    -- Update profiles table
    UPDATE profiles 
    SET 
        resume_url = p_resume_url,
        resume_filename = p_filename,
        resume_file_size = p_file_size,
        resume_file_type = p_file_type,
        resume_uploaded_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a function to get the current resume for a user
CREATE OR REPLACE FUNCTION get_user_current_resume(p_user_id UUID)
RETURNS TABLE (
    resume_url TEXT,
    filename TEXT,
    file_size BIGINT,
    file_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ru.public_url,
        ru.filename,
        ru.file_size,
        ru.file_type,
        ru.uploaded_at
    FROM resume_uploads ru
    WHERE ru.user_id = p_user_id AND ru.is_current = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a function to get resume upload history for a user
CREATE OR REPLACE FUNCTION get_user_resume_history(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    filename TEXT,
    file_size BIGINT,
    file_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ru.id,
        ru.filename,
        ru.file_size,
        ru.file_type,
        ru.uploaded_at,
        ru.is_current
    FROM resume_uploads ru
    WHERE ru.user_id = p_user_id
    ORDER BY ru.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 9. Create RLS (Row Level Security) policies for resume_uploads table
ALTER TABLE resume_uploads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own resume uploads
CREATE POLICY "Users can view own resume uploads" ON resume_uploads
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own resume uploads
CREATE POLICY "Users can insert own resume uploads" ON resume_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own resume uploads
CREATE POLICY "Users can update own resume uploads" ON resume_uploads
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own resume uploads
CREATE POLICY "Users can delete own resume uploads" ON resume_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Create RLS policies for resume_parsing_results table
ALTER TABLE resume_parsing_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own parsing results
CREATE POLICY "Users can view own parsing results" ON resume_parsing_results
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own parsing results
CREATE POLICY "Users can insert own parsing results" ON resume_parsing_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own parsing results
CREATE POLICY "Users can update own parsing results" ON resume_parsing_results
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own parsing results
CREATE POLICY "Users can delete own parsing results" ON resume_parsing_results
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Create a trigger to automatically update resume_uploaded_at when resume_url is updated
CREATE OR REPLACE FUNCTION update_resume_uploaded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resume_url IS DISTINCT FROM OLD.resume_url THEN
        NEW.resume_uploaded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_resume_uploaded_at'
    ) THEN
        CREATE TRIGGER trigger_update_resume_uploaded_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_resume_uploaded_at();
    END IF;
END $$; 