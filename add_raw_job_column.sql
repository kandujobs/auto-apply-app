-- Add raw_job column to job_swipes table
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS raw_job JSONB;

-- Add title and company columns if they don't exist
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS company TEXT;

-- Create index for raw_job column
CREATE INDEX IF NOT EXISTS idx_job_swipes_raw_job ON job_swipes USING GIN (raw_job); 