# Auto-Apply System Setup Guide

This guide will help you set up the auto-apply system to work with the React application.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A LinkedIn account with credentials
- A resume file (PDF format recommended)

## Setup Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Build the Auto-Apply System

```bash
cd auto-apply
npm install
npm run build
```

### 3. Start the Backend Server

```bash
cd backend
npm start
```

The backend server will run on `http://localhost:3001`.

### 4. Configure LinkedIn Credentials

1. Go to the React app
2. Navigate to the Auto-Apply screen
3. Click "Edit" in the LinkedIn Credentials section
4. Enter your LinkedIn email and password
5. Click "Save"

### 5. Test the Auto-Apply System

1. In the React app, go to the Auto-Apply screen
2. Click "Test Auto-Apply"
3. The system will attempt to apply to a test job

## How It Works

1. **Frontend (React App)**: The user interface for managing LinkedIn credentials and triggering auto-applications
2. **Backend (Express Server)**: Handles API requests and manages the auto-apply process
3. **Auto-Apply System (Node.js)**: The actual automation that applies to LinkedIn jobs

## File Structure

```
├── src/
│   ├── services/
│   │   ├── autoApplyBridge.ts    # Frontend integration
│   │   └── linkedinCredentials.ts # Credential management
│   └── Components/
│       └── AutoApplyScreen.tsx   # UI for auto-apply
├── backend/
│   ├── server.js                 # Express API server
│   └── package.json
└── auto-apply/
    ├── src/
    │   ├── linkedinApply.ts      # Main automation logic
    │   ├── browser.ts            # Browser management
    │   └── utils.ts              # Utility functions
    └── package.json
```

## Troubleshooting

### Backend Not Starting
- Check if port 3001 is available
- Ensure all dependencies are installed
- Check console for error messages

### Auto-Apply Not Working
- Verify LinkedIn credentials are saved
- Check that the auto-apply system is built (`npm run build` in auto-apply directory)
- Ensure the backend server is running
- Check browser console for error messages

### LinkedIn Login Issues
- Make sure your LinkedIn credentials are correct
- Consider using 2FA and app passwords if enabled
- Check if LinkedIn is blocking automated access

## Security Notes

- LinkedIn credentials are encrypted before storage
- The auto-apply system runs in a controlled environment
- Screenshots are taken for verification
- Rate limiting is implemented to avoid detection

## Development

To run in development mode:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev

# Terminal 3: Auto-apply (if needed)
cd auto-apply
npm run dev
```

## Production Deployment

For production deployment:

1. Set up environment variables for LinkedIn credentials
2. Use a headless browser in production
3. Implement proper error handling and logging
4. Set up monitoring for the auto-apply process
5. Consider using a job queue for managing applications

## API Endpoints

- `POST /api/auto-apply`: Submit a job application
- `GET /api/health`: Health check endpoint

## Environment Variables

The auto-apply system uses these environment variables:

- `LINKEDIN_EMAIL`: LinkedIn account email
- `LINKEDIN_PASSWORD`: LinkedIn account password
- `BROWSER_HEADLESS`: Set to 'true' for headless mode
- `BROWSER_SLOW_MO`: Browser delay in milliseconds
- `RESUME_PATH`: Path to resume file
- `SCREENSHOT_DIR`: Directory for screenshots
- `PAGE_LOAD_TIMEOUT`: Page load timeout in milliseconds
- `ELEMENT_WAIT_TIMEOUT`: Element wait timeout in milliseconds 