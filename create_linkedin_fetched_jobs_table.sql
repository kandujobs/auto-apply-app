-- Create table for storing LinkedIn fetched jobs
CREATE TABLE linkedin_fetched_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company_name TEXT,
    location TEXT,
    job_url TEXT NOT NULL,
    easy_apply BOOLEAN DEFAULT false,
    salary TEXT,
    description TEXT,
    posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create index for faster queries
CREATE INDEX idx_linkedin_fetched_jobs_user_id ON linkedin_fetched_jobs(user_id);
CREATE INDEX idx_linkedin_fetched_jobs_created_at ON linkedin_fetched_jobs(created_at);

-- Enable Row Level Security
ALTER TABLE linkedin_fetched_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own fetched jobs
CREATE POLICY "Users can view their own fetched jobs" ON linkedin_fetched_jobs
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own fetched jobs
CREATE POLICY "Users can insert their own fetched jobs" ON linkedin_fetched_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own fetched jobs
CREATE POLICY "Users can update their own fetched jobs" ON linkedin_fetched_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own fetched jobs
CREATE POLICY "Users can delete their own fetched jobs" ON linkedin_fetched_jobs
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_linkedin_fetched_jobs_updated_at 
    BEFORE UPDATE ON linkedin_fetched_jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 