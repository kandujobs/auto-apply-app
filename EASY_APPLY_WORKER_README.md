# Easy Apply Worker System

## Overview

The Easy Apply Worker is a background process that automatically applies to LinkedIn jobs when users swipe right in the app. It stays running and continuously monitors for new job applications.

## How It Works

1. **User swipes right on a job** → Job is saved to `job_swipes` table with `swipe_direction = 'right'`
2. **Easy Apply Worker detects pending applications** → Checks for jobs with `application_processed = null`
3. **Worker applies to job** → Uses LinkedIn Easy Apply to submit application
4. **Worker updates status** → Marks `application_processed = true` and records success/failure

## Database Schema

### New Columns in `job_swipes` table:
- `application_processed` (BOOLEAN) - Whether the application has been processed
- `application_success` (BOOLEAN) - Whether the application was successful
- `application_error` (TEXT) - Error message if application failed
- `application_processed_at` (TIMESTAMP) - When the application was processed

## Components

### 1. Easy Apply Worker (`auto-apply/src/easyApplyWorker.ts`)
- Main worker process that stays running
- Logs into LinkedIn and monitors for pending applications
- Automatically applies to jobs using Easy Apply
- Updates application status in database

### 2. Frontend Service (`src/services/easyApplyWorker.ts`)
- `startEasyApplyWorker()` - Starts the worker process
- `getPendingApplications()` - Gets count of pending applications
- `getApplicationStatus()` - Gets worker status
- `getApplicationHistory()` - Gets application history

### 3. Backend Endpoint (`backend/server.js`)
- `/api/start-easy-apply-worker` - Starts the worker process

### 4. UI Integration (`src/Components/AutoApplyScreen.tsx`)
- Button to start the worker
- Status display showing if worker is running
- Pending application count

## Usage

### Starting the Worker

1. **Save LinkedIn Credentials** in the Auto Apply screen
2. **Click "Start Easy Apply Worker"** button
3. **Worker starts running** in the background
4. **Swipe right on jobs** in the main app
5. **Worker automatically applies** to those jobs

### Worker Status

The worker will show:
- ✅ **Worker Running** - Worker is active
- 🔄 **Starting...** - Worker is starting up
- **Pending applications count** - How many jobs are waiting to be applied to

### Application Process

1. Worker checks for pending applications every 5 seconds
2. For each pending job:
   - Navigates to job URL
   - Checks if Easy Apply is available
   - Fills out application form with user profile data
   - Submits application
   - Takes screenshot of result
   - Updates database with success/failure status

## Configuration

### Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `LINKEDIN_EMAIL` - LinkedIn login email
- `LINKEDIN_PASSWORD` - LinkedIn login password
- `BROWSER_HEADLESS` - Whether to run browser in headless mode
- `RESUME_PATH` - Path to resume file

### User Profile Requirements
- First name
- Last name
- Email
- Phone number
- Location
- Resume file

## Error Handling

- **LinkedIn login failures** - Worker will retry login
- **Job no longer accepting applications** - Marks job as closed with error
- **Form filling errors** - Logs error and continues with next job
- **Network issues** - Retries with exponential backoff

## Monitoring

### Database Queries
```sql
-- Check pending applications
SELECT COUNT(*) FROM job_swipes 
WHERE user_id = 'user-id' 
AND swipe_direction = 'right' 
AND application_processed IS NULL;

-- Check recent applications
SELECT * FROM job_swipes 
WHERE user_id = 'user-id' 
AND swipe_direction = 'right' 
AND application_processed = true
ORDER BY application_processed_at DESC;
```

### Logs
- Worker logs all activities to console
- Screenshots saved for successful/failed applications
- Error details stored in database

## Security

- Uses Supabase Row Level Security (RLS)
- Users can only access their own job data
- LinkedIn credentials encrypted in database
- Service role key used only for worker operations

## Troubleshooting

### Common Issues

1. **Worker won't start**
   - Check LinkedIn credentials are saved
   - Verify backend server is running
   - Check environment variables

2. **Applications not being processed**
   - Check worker is running
   - Verify job URLs are valid
   - Check LinkedIn login status

3. **Easy Apply not working**
   - Job may not have Easy Apply option
   - LinkedIn may have changed selectors
   - Check for CAPTCHA or verification

### Debug Mode

Set `BROWSER_HEADLESS = false` to see browser actions in real-time.

## Future Enhancements

- Multiple worker instances for different users
- Application templates for different job types
- Advanced form filling with AI
- Application tracking and follow-up
- Integration with ATS systems 