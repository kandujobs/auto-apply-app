# Session-Based Application System

## Overview

The application system has been updated to use a session-based approach where the browser initialization (login and checkpoint handling) is separated from the job application process.

## How It Works

### 1. Session Initialization
When a user clicks "Start Session":
- The system opens a browser
- Logs into LinkedIn using stored credentials
- Handles any security checkpoints manually
- Navigates to LinkedIn feed
- Keeps the browser open and ready for applications

### 2. Job Application
When a user clicks "Apply" on a job:
- The system checks if a session is active
- If no session is active, shows a notification to start a session first
- If session is active, navigates the existing browser to the job page
- Performs the application process using the existing browser session

## Benefits

1. **Faster Applications**: No need to login for each application
2. **Better Security**: Handles checkpoints once at the start
3. **More Reliable**: Reuses the same browser session
4. **User Control**: Users can see the browser and intervene if needed

## API Endpoints

### Start Session
```
POST /api/session/start
{
  "userId": "user-id",
  "linkedInCredentials": {
    "email": "user@email.com",
    "password": "decrypted-password"
  }
}
```

### Check Session Status
```
GET /api/session/status/:userId
```

### Apply to Job
```
POST /api/apply-job
{
  "userId": "user-id",
  "jobId": "job-id",
  "jobUrl": "https://linkedin.com/jobs/view/job-id/"
}
```

### End Session
```
POST /api/session/end
{
  "userId": "user-id"
}
```

## Frontend Integration

The SessionManager component shows the current session status:
- 🔴 Session Inactive
- 🟡 Initializing session...
- 🟢 Session Ready - You can now apply to jobs!

## Browser Initialization Script

The `test-simple-click.js` script now supports two modes:
1. **Session Initialization**: `node test-simple-click.js --init-session`
2. **Job Application**: `node test-simple-click.js` (with JOB_URL environment variable)

## Environment Variables

For session initialization:
- `SESSION_USER_ID`: The user ID for the session
- `LINKEDIN_EMAIL`: LinkedIn email
- `LINKEDIN_PASSWORD`: LinkedIn password
- `SESSION_MODE`: Set to 'true'

For job application:
- `SESSION_USER_ID`: The user ID for the session
- `SESSION_MODE`: Set to 'true'
- `JOB_URL`: The LinkedIn job URL to apply to

## Usage Flow

1. User adds LinkedIn credentials to their profile
2. User clicks "Start Session" - browser opens and logs in
3. User completes any security checkpoints manually
4. Browser navigates to LinkedIn feed and stays open
5. User can now apply to jobs - each application uses the same browser session
6. User clicks "Stop Session" to close the browser

## Error Handling

- If no LinkedIn credentials are found, shows error message
- If session is not active when trying to apply, shows notification
- If browser initialization fails, shows error details
- Automatic session cleanup after 5 minutes of inactivity 