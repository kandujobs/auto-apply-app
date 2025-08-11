-- Add application tracking columns to job_swipes table
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS application_processed BOOLEAN DEFAULT false;
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS application_success BOOLEAN DEFAULT false;
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS application_error TEXT;
ALTER TABLE job_swipes ADD COLUMN IF NOT EXISTS application_processed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on application processing
CREATE INDEX IF NOT EXISTS idx_job_swipes_application_processed ON job_swipes(application_processed);
CREATE INDEX IF NOT EXISTS idx_job_swipes_user_swipe_direction ON job_swipes(user_id, swipe_direction); 