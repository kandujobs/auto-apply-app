-- Add job_title and company columns to existing job_swipes table
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS company TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_job_swipes_job_title ON job_swipes(job_title);
CREATE INDEX IF NOT EXISTS idx_job_swipes_company ON job_swipes(company); 