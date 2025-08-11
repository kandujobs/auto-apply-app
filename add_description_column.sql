-- Add description column to existing linkedin_fetched_jobs table
ALTER TABLE linkedin_fetched_jobs ADD COLUMN IF NOT EXISTS description TEXT; 