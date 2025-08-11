-- Update job_swipes table to make job_id a foreign key reference to linkedin_fetched_jobs
-- This script will:
-- 1. Convert job_id from text to uuid type
-- 2. Add a foreign key constraint to job_id
-- 3. Ensure data integrity between the tables

-- First, let's check if there are any existing job_ids in job_swipes that don't exist in linkedin_fetched_jobs
-- This will help us identify any orphaned records before making the change
SELECT DISTINCT js.job_id 
FROM job_swipes js 
LEFT JOIN linkedin_fetched_jobs lfj ON js.job_id = lfj.id::text 
WHERE lfj.id IS NULL;

-- If the above query returns any results, you'll need to clean up those records first
-- Then proceed with the type conversion and foreign key constraint:

-- Step 1: Convert job_id column from text to uuid
-- This will fail if any job_id values are not valid UUIDs
ALTER TABLE job_swipes 
ALTER COLUMN job_id TYPE uuid USING job_id::uuid;

-- Step 2: Add foreign key constraint
ALTER TABLE job_swipes 
ADD CONSTRAINT fk_job_swipes_job_id 
FOREIGN KEY (job_id) 
REFERENCES linkedin_fetched_jobs(id);

-- Verify the foreign key constraint was created successfully
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='job_swipes';

-- Optional: Check the data types to confirm the change
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'job_swipes' 
  AND column_name = 'job_id'; 