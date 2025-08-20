-- Remove data management fields from privacy_settings in profiles table
-- This removes the data export, deletion, and auto-delete functionality

-- Update existing privacy_settings to remove data management fields
UPDATE profiles 
SET privacy_settings = privacy_settings - 'allowDataExport' - 'allowDataDeletion' - 'autoDeleteInactive'
WHERE privacy_settings IS NOT NULL;

-- Alternative approach: Update specific users with data management fields
-- UPDATE profiles 
-- SET privacy_settings = jsonb_set(
--   privacy_settings, 
--   '{allowDataExport}', 
--   NULL
-- ) - 'allowDataDeletion' - 'autoDeleteInactive'
-- WHERE privacy_settings ? 'allowDataExport' 
--    OR privacy_settings ? 'allowDataDeletion' 
--    OR privacy_settings ? 'autoDeleteInactive';

-- Verify the changes
SELECT 
  id,
  privacy_settings
FROM profiles 
WHERE privacy_settings IS NOT NULL
LIMIT 5;
