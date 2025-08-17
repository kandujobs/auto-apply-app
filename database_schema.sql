-- Essential Questions Tables for User and Employer Questions

-- Table for user essential questions
CREATE TABLE IF NOT EXISTS user_essential_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    authorized_to_work TEXT,
    require_sponsorship TEXT,
    convicted_felony TEXT,
    start_availability TEXT,
    pre_employment_screening TEXT,
    willing_to_relocate TEXT,
    gender_identity TEXT,
    pronouns TEXT,
    race_ethnicity TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for employer essential questions
CREATE TABLE IF NOT EXISTS employer_essential_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    authorized_to_work TEXT,
    require_sponsorship TEXT,
    convicted_felony TEXT,
    start_availability TEXT,
    pre_employment_screening TEXT,
    willing_to_relocate TEXT,
    gender_identity TEXT,
    pronouns TEXT,
    race_ethnicity TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for jobs (employer-created jobs) - Updated to match actual schema
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    location TEXT,
    salary TEXT,
    description TEXT,
    requirements TEXT,
    type TEXT,
    tags TEXT[],
    status TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for job applications (for employer-created jobs)
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'applied', -- 'applied', 'saved', 'rejected'
    raw_job JSONB,
    UNIQUE(user_id, job_id)
);

-- Table for job swipes (for API jobs) - Updated to match actual schema
CREATE TABLE IF NOT EXISTS job_swipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL, -- API job ID (string)
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    swipe_direction TEXT NOT NULL, -- 'left', 'right'
    swiped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_job JSONB,
    UNIQUE(user_id, job_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_essential_questions_user_id ON user_essential_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_essential_questions_employer_id ON employer_essential_questions(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_swipes_user_id ON job_swipes(user_id);
CREATE INDEX IF NOT EXISTS idx_job_swipes_job_id ON job_swipes(job_id);
CREATE INDEX IF NOT EXISTS idx_job_swipes_direction ON job_swipes(swipe_direction);

-- Note: After running this schema, also run education_experience_schema.sql to create the education and experience tables 