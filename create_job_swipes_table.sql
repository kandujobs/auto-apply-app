-- Create table for tracking job swipes/viewed jobs
CREATE TABLE job_swipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL, -- This can be either linkedin_fetched_jobs.id or external job IDs
    job_title TEXT, -- Store job title for better tracking
    company TEXT, -- Store company name for better tracking
    swipe_direction TEXT NOT NULL CHECK (swipe_direction IN ('left', 'right', 'saved')),
    swiped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Create index for faster queries
CREATE INDEX idx_job_swipes_user_id ON job_swipes(user_id);
CREATE INDEX idx_job_swipes_job_id ON job_swipes(job_id);
CREATE INDEX idx_job_swipes_swiped_at ON job_swipes(swiped_at);
CREATE INDEX idx_job_swipes_job_title ON job_swipes(job_title);
CREATE INDEX idx_job_swipes_company ON job_swipes(company);

-- Enable Row Level Security
ALTER TABLE job_swipes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own swipes
CREATE POLICY "Users can view their own swipes" ON job_swipes
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own swipes
CREATE POLICY "Users can insert their own swipes" ON job_swipes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own swipes
CREATE POLICY "Users can update their own swipes" ON job_swipes
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own swipes
CREATE POLICY "Users can delete their own swipes" ON job_swipes
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
CREATE TRIGGER update_job_swipes_updated_at 
    BEFORE UPDATE ON job_swipes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 