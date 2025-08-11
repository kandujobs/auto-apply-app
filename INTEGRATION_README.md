# LinkedIn Auto-Apply Integration Guide

This guide explains how to integrate the LinkedIn auto-apply system with your main React application.

## 🏗️ Architecture Overview

The integration consists of several components:

1. **LinkedIn Credentials Management** - Secure storage and retrieval of LinkedIn login credentials
2. **Auto-Apply Bridge** - Connects the React app with the Node.js auto-apply system
3. **UI Components** - React components for managing credentials and testing the system

## 📁 File Structure

```
src/
├── Components/
│   ├── AutoApplyScreen.tsx          # Main auto-apply screen (updated)
│   └── LinkedInCredentialsSection.tsx # LinkedIn credentials management
├── services/
│   ├── linkedinCredentials.ts       # LinkedIn credentials service
│   └── autoApplyBridge.ts          # Bridge to auto-apply system
└── utils/
    └── encryption.ts               # Encryption utilities
```

## 🗄️ Database Setup

### 1. Create LinkedIn Credentials Table

Run the SQL script to create the `linkedin_credentials` table:

```sql
-- Run this in your Supabase SQL editor
-- See: create_linkedin_credentials_table.sql
```

### 2. Enable Row Level Security (RLS)

The table includes RLS policies to ensure users can only access their own credentials.

## 🔐 Security Features

- **Encrypted Storage**: Passwords are encrypted before storing in the database
- **Row Level Security**: Users can only access their own credentials
- **Input Validation**: Email and password validation
- **Secure Retrieval**: Credentials are decrypted only when needed

## 🚀 Usage

### 1. Save LinkedIn Credentials

Users can save their LinkedIn credentials through the UI:

```typescript
import { saveLinkedInCredentials } from '../services/linkedinCredentials';

const result = await saveLinkedInCredentials({
  email: 'user@example.com',
  password: 'userpassword'
});
```

### 2. Apply to Jobs

Use the bridge service to apply to LinkedIn jobs:

```typescript
import { applyToLinkedInJob } from '../services/autoApplyBridge';

const result = await applyToLinkedInJob(jobUrl, userProfile);
```

### 3. Validate Setup

Check if auto-apply is ready:

```typescript
import { validateAutoApplySetup } from '../services/autoApplyBridge';

const validation = await validateAutoApplySetup();
if (validation.ready) {
  // Ready to auto-apply
} else {
  // Missing: validation.missing
}
```

## 🔧 Integration Steps

### Step 1: Database Setup

1. Run the SQL script in your Supabase dashboard
2. Verify RLS policies are active

### Step 2: Install Dependencies

The auto-apply system requires Playwright:

```bash
cd auto-apply
npm install
npx playwright install chromium
```

### Step 3: Configure Environment

Create a `.env` file in the auto-apply directory:

```env
LINKEDIN_EMAIL=your_email@example.com
LINKEDIN_PASSWORD=your_password
BROWSER_HEADLESS=false
BROWSER_SLOW_MO=1000
RESUME_PATH=./resume.pdf
SCREENSHOT_DIR=./screenshots
```

### Step 4: Test the Integration

1. Navigate to the Auto-Apply screen in your app
2. Save your LinkedIn credentials
3. Click the "Test Auto-Apply" button
4. Check the console for logs

## 🔄 Connecting to the Auto-Apply System

Currently, the bridge service simulates the auto-apply process. To connect to the actual Node.js auto-apply system, you have several options:

### Option 1: Backend API (Recommended)

Create a backend API endpoint that runs the auto-apply system:

```typescript
// In your backend
app.post('/api/auto-apply', async (req, res) => {
  const { jobUrl, userProfile } = req.body;
  
  // Run the auto-apply system
  const result = await autoApplyLinkedIn(jobUrl, userProfile);
  
  res.json(result);
});
```

### Option 2: Child Process

Run the auto-apply system as a child process:

```typescript
import { spawn } from 'child_process';

const autoApplyProcess = spawn('node', ['auto-apply/dist/index.js'], {
  env: { ...process.env, ...envVars }
});
```

### Option 3: Web Worker

Run the auto-apply logic in a web worker (limited by browser security).

## 🧪 Testing

### Manual Testing

1. **Save Credentials**: Test saving and retrieving LinkedIn credentials
2. **Validation**: Test the setup validation
3. **Auto-Apply**: Test the auto-apply process with a real job URL

### Automated Testing

Create tests for the integration:

```typescript
// Test credentials service
describe('LinkedIn Credentials', () => {
  it('should save credentials', async () => {
    const result = await saveLinkedInCredentials({
      email: 'test@example.com',
      password: 'testpassword'
    });
    expect(result.success).toBe(true);
  });
});
```

## 🔒 Security Considerations

### Production Security

1. **Use Environment Variables**: Store encryption keys in environment variables
2. **Strong Encryption**: Use a proper encryption library (e.g., crypto-js)
3. **HTTPS Only**: Ensure all API calls use HTTPS
4. **Rate Limiting**: Implement rate limiting for auto-apply requests
5. **Audit Logging**: Log all auto-apply activities

### Encryption Upgrade

Replace the simple encryption with a proper library:

```typescript
import CryptoJS from 'crypto-js';

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Credentials Not Found**
   - Check if user is authenticated
   - Verify RLS policies are working
   - Check database connection

2. **Auto-Apply Fails**
   - Verify LinkedIn credentials are correct
   - Check if job URL is valid
   - Ensure Playwright is installed

3. **Encryption Errors**
   - Verify encryption key is set
   - Check if encryption functions are working

### Debug Mode

Enable debug logging:

```typescript
// In autoApplyBridge.ts
console.log('Debug: Starting auto-apply process');
console.log('Debug: Job URL:', jobUrl);
console.log('Debug: User Profile:', userProfile);
```

## 📈 Next Steps

1. **Real Integration**: Connect to the actual auto-apply system
2. **Job Queue**: Implement a job queue for batch applications
3. **Progress Tracking**: Add real-time progress updates
4. **Error Recovery**: Implement retry mechanisms
5. **Analytics**: Track application success rates

## 📞 Support

For issues or questions:

1. Check the console for error messages
2. Verify database setup
3. Test with a simple job URL first
4. Check LinkedIn credentials manually

## 🔄 Updates

Keep the auto-apply system updated:

```bash
cd auto-apply
npm update
npx playwright install chromium
```

This integration provides a solid foundation for connecting your React app with the LinkedIn auto-apply system. The modular design allows for easy customization and extension as your needs evolve. 