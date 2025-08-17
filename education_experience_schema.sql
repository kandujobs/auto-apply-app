-- Education and Experience Tables Schema

-- Table for user education
CREATE TABLE IF NOT EXISTS education (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT,
    field TEXT,
    start_date DATE,
    end_date DATE,
    gpa TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user experience
CREATE TABLE IF NOT EXISTS experience (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_education_profile_id ON education(profile_id);
CREATE INDEX IF NOT EXISTS idx_experience_profile_id ON experience(profile_id);
CREATE INDEX IF NOT EXISTS idx_education_institution ON education(institution);
CREATE INDEX IF NOT EXISTS idx_experience_company ON experience(company);

-- Enable Row Level Security
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Education Table
CREATE POLICY "Users can view own education" ON education
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own education" ON education
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own education" ON education
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own education" ON education
    FOR DELETE USING (auth.uid() = profile_id);

-- RLS Policies for Experience Table
CREATE POLICY "Users can view own experience" ON experience
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own experience" ON experience
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own experience" ON experience
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own experience" ON experience
    FOR DELETE USING (auth.uid() = profile_id);

-- Grant permissions
GRANT ALL ON education TO authenticated;
GRANT ALL ON experience TO authenticated;
GRANT ALL ON education TO service_role;
GRANT ALL ON experience TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experience_updated_at BEFORE UPDATE ON experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
