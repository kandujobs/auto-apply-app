-- Add notification and privacy settings columns to profiles table
-- This allows users to customize their notification and privacy preferences

-- Add notification_settings column (JSONB for flexible structure)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "emailNotifications": true,
  "jobMatchNotifications": true,
  "weeklySummary": false,
  "applicationUpdates": true,
  "newJobAlerts": true,
  "employerMessages": true,
  "pushNotifications": false,
  "pushJobMatches": true,
  "pushApplications": true,
  "pushMessages": true,
  "autoApplyNotifications": true,
  "autoApplySuccess": true,
  "autoApplyErrors": true,
  "autoApplyDaily": false,
  "linkedInNotifications": true,
  "linkedInJobAlerts": true,
  "linkedInMessages": false
}'::jsonb;

-- Add privacy_settings column (JSONB for flexible structure)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profileVisibleToEmployers": true,
  "showInPublicSearch": false,
  "showContactInfo": true,
  "showResume": true,
  "allowMessagesFromEmployers": true,
  "allowDataAnalytics": true,
  "allowThirdPartySharing": false,
  "twoFactorAuthentication": false,
  "sessionTimeout": 30,
  "loginNotifications": true,
  "allowDataExport": true,
  "allowDataDeletion": true,
  "autoDeleteInactive": false
}'::jsonb;

-- Add indexes for better performance when querying settings
CREATE INDEX IF NOT EXISTS idx_profiles_notification_settings ON profiles USING GIN (notification_settings);
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_settings ON profiles USING GIN (privacy_settings);

-- Add comments for documentation
COMMENT ON COLUMN profiles.notification_settings IS 'User notification preferences stored as JSONB';
COMMENT ON COLUMN profiles.privacy_settings IS 'User privacy preferences stored as JSONB';

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('notification_settings', 'privacy_settings')
ORDER BY column_name;
