# LinkedIn Job Fetching System

This system integrates LinkedIn job search functionality into the React app, allowing users to discover and apply to jobs directly from LinkedIn with Easy Apply support.

## 🚀 Features

### Job Discovery
- **LinkedIn Integration**: Search LinkedIn for jobs using Playwright automation
- **Easy Apply Filter**: Automatically filter for jobs with Easy Apply functionality
- **Real-time Data**: Fetch live job listings with company info, salary, and requirements
- **Smart Matching**: Display fit scores and relevant job information

### Auto-Apply System
- **Automated Applications**: Apply to jobs with one click using saved credentials
- **Resume Upload**: Automatic resume submission during application process
- **Screenshot Capture**: Save application confirmations and error screenshots
- **Batch Processing**: Apply to multiple jobs with intelligent delays

## 🏗️ Architecture

### Backend Components
```
backend/
├── server.js              # Express API server
├── package.json           # Backend dependencies
└── auto-apply/           # LinkedIn automation system
    ├── src/
    │   ├── index.ts      # Main entry point
    │   ├── jobFetcher.ts # LinkedIn job search
    │   ├── linkedinApply.ts # Auto-apply logic
    │   ├── browser.ts    # Playwright browser management
    │   └── utils.ts      # Utility functions
    └── dist/             # Compiled TypeScript
```

### Frontend Integration
```
src/
├── services/
│   ├── jobFetcher.ts     # LinkedIn job fetching service
│   ├── autoApplyBridge.ts # Auto-apply integration
│   └── linkedinCredentials.ts # Credential management
├── Components/
│   ├── SwipeCard.tsx     # Job card with LinkedIn support
│   └── AutoApplyScreen.tsx # Auto-apply settings
└── types/
    └── Job.ts            # Updated Job interface
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Auto-apply system dependencies
cd ../auto-apply
npm install
npm run build
```

### 2. Configure LinkedIn Credentials

1. Go to the React app
2. Navigate to Auto-Apply screen
3. Click "Edit" in LinkedIn Credentials section
4. Enter your LinkedIn email and password
5. Click "Save"

### 3. Start the Backend Server

```bash
cd backend
npm start
```

The server will run on `http://localhost:3001`

### 4. Test the System

```bash
# Test job fetching
node test-job-fetch.js

# Test auto-apply
node test-auto-apply.js
```

## 📋 API Endpoints

### Job Search
```http
POST /api/job-search
Content-Type: application/json

{
  "jobTitle": "Software Engineer",
  "location": "San Francisco, CA",
  "maxResults": 20,
  "linkedInCredentials": {
    "email": "user@example.com",
    "password": "password"
  }
}
```

### Job Details
```http
POST /api/job-details
Content-Type: application/json

{
  "jobUrl": "https://www.linkedin.com/jobs/view/123456789",
  "linkedInCredentials": {
    "email": "user@example.com",
    "password": "password"
  }
}
```

### Auto-Apply
```http
POST /api/auto-apply
Content-Type: application/json

{
  "jobUrl": "https://www.linkedin.com/jobs/view/123456789",
  "userProfile": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "location": "San Francisco, CA",
    "resumePath": "./resume.pdf",
    "experience": [...],
    "education": [...],
    "skills": [...]
  },
  "linkedInCredentials": {
    "email": "user@example.com",
    "password": "password"
  }
}
```

## 🎯 Usage Flow

### 1. Job Discovery
1. User sets up LinkedIn credentials
2. App searches LinkedIn for jobs matching user's profile
3. Jobs are displayed as swipeable cards
4. LinkedIn jobs show Easy Apply badges and source information

### 2. Job Application
1. User swipes right on a LinkedIn job
2. If Easy Apply is available, auto-apply system is triggered
3. System logs into LinkedIn and navigates to job page
4. Application form is filled automatically with user's profile data
5. Resume is uploaded and application is submitted
6. Screenshot is saved for confirmation

### 3. Job Management
- **Saved Jobs**: Users can save jobs for later review
- **Applied Jobs**: Track applications and responses
- **Rejected Jobs**: Keep track of passed opportunities

## 🔧 Configuration

### Environment Variables
```bash
# LinkedIn credentials
LINKEDIN_EMAIL=your-email@example.com
LINKEDIN_PASSWORD=your-password

# Browser settings
BROWSER_HEADLESS=false
BROWSER_SLOW_MO=1000

# File paths
RESUME_PATH=./resume.pdf
SCREENSHOT_DIR=./screenshots

# Timeouts
PAGE_LOAD_TIMEOUT=30000
ELEMENT_WAIT_TIMEOUT=10000
```

### Browser Settings
- **Headless Mode**: Set to `false` for debugging
- **Slow Motion**: Adds delays to avoid detection
- **Screenshots**: Automatic capture of application process

## 🎨 UI Features

### LinkedIn Job Cards
- **Easy Apply Badge**: Green badge for Easy Apply jobs
- **LinkedIn Source Badge**: Blue badge indicating LinkedIn source
- **Job Details**: Posted time, applicant count, salary info
- **Quick Apply Button**: Lightning bolt icon for Easy Apply jobs

### Auto-Apply Settings
- **Credential Management**: Secure storage of LinkedIn credentials
- **Profile Integration**: Use app profile data for applications
- **Test Functionality**: Verify auto-apply system works correctly

## 🔒 Security Considerations

### Credential Storage
- LinkedIn credentials are encrypted and stored securely
- Credentials are only used for job applications
- No credential data is logged or exposed

### Rate Limiting
- Built-in delays between applications
- Random delays to avoid detection
- Respectful of LinkedIn's terms of service

### Error Handling
- Comprehensive error logging
- Screenshot capture for debugging
- Graceful fallbacks for network issues

## 🚨 Troubleshooting

### Common Issues

1. **Login Failures**
   - Verify LinkedIn credentials are correct
   - Check for 2FA requirements
   - Ensure account is not locked

2. **Job Search Errors**
   - Check internet connection
   - Verify LinkedIn is accessible
   - Review browser automation logs

3. **Auto-Apply Failures**
   - Ensure resume file exists
   - Check job URL is valid
   - Review application form structure

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm start

# View screenshots
ls screenshots/
```

## 📈 Future Enhancements

### Planned Features
- **Smart Job Matching**: AI-powered job recommendations
- **Application Tracking**: Real-time application status updates
- **Resume Optimization**: Automatic resume tailoring for jobs
- **Interview Preparation**: AI-powered interview prep tools

### Technical Improvements
- **Parallel Processing**: Multiple browser instances for faster applications
- **Job Queue**: Background job processing system
- **Analytics Dashboard**: Application success metrics
- **Mobile Support**: React Native integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This system is for educational purposes. Please respect LinkedIn's terms of service and use responsibly. 