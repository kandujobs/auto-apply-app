# LinkedIn Auto-Apply System

A Playwright-based automation system for applying to LinkedIn Easy Apply jobs automatically.

## Features

- 🤖 Automated LinkedIn Easy Apply job applications
- 🔐 Persistent login session management
- 📄 Resume upload automation
- 📝 Automatic form filling
- 📸 Screenshot capture for verification
- ⏱️ Random delays to avoid detection
- 🔄 Retry mechanism with exponential backoff
- 📊 Batch application support
- 🛡️ Error handling and logging

## Project Structure

```
/auto-apply
├── src/
│   ├── index.ts         # Entry point and main execution
│   ├── linkedinApply.ts # Main LinkedIn automation logic
│   ├── browser.ts       # Browser setup and session management
│   ├── config.ts        # Environment configuration
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Utility functions
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- LinkedIn account
- Resume file (PDF format)

## Installation

1. **Clone or navigate to the auto-apply directory:**
   ```bash
   cd auto-apply
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your LinkedIn credentials:
   ```env
   LINKEDIN_EMAIL=your_email@example.com
   LINKEDIN_PASSWORD=your_password
   BROWSER_HEADLESS=false
   BROWSER_SLOW_MO=1000
   RESUME_PATH=./resume.pdf
   SCREENSHOT_DIR=./screenshots
   ```

5. **Add your resume:**
   Place your resume PDF file in the auto-apply directory and update the `RESUME_PATH` in `.env`.

## Usage

### Basic Usage

1. **Update the job URL in `src/index.ts`:**
   ```typescript
   const jobUrl = 'https://www.linkedin.com/jobs/view/YOUR_JOB_ID';
   ```

2. **Update the test profile in `src/index.ts` with your information:**
   ```typescript
   const testProfile: UserProfile = {
     firstName: 'Your',
     lastName: 'Name',
     email: 'your.email@example.com',
     phone: '+1-555-123-4567',
     // ... other profile data
   };
   ```

3. **Run the application:**
   ```bash
   npm run dev
   ```

### Programmatic Usage

```typescript
import { autoApplyLinkedIn } from './src/linkedinApply.js';
import { UserProfile } from './src/types.js';

const profile: UserProfile = {
  // Your profile data
};

const result = await autoApplyLinkedIn('https://www.linkedin.com/jobs/view/123456', profile);

if (result.success) {
  console.log(`Applied successfully to ${result.jobTitle}`);
} else {
  console.log(`Failed: ${result.error}`);
}
```

### Batch Applications

```typescript
import { applyToMultipleJobs } from './src/index.js';

const jobUrls = [
  'https://www.linkedin.com/jobs/view/123456',
  'https://www.linkedin.com/jobs/view/789012',
  // ... more job URLs
];

const results = await applyToMultipleJobs(jobUrls, profile);
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LINKEDIN_EMAIL` | Your LinkedIn email | Required |
| `LINKEDIN_PASSWORD` | Your LinkedIn password | Required |
| `BROWSER_HEADLESS` | Run browser in headless mode | `false` |
| `BROWSER_SLOW_MO` | Delay between actions (ms) | `1000` |
| `RESUME_PATH` | Path to your resume PDF | `./resume.pdf` |
| `SCREENSHOT_DIR` | Directory for screenshots | `./screenshots` |
| `PAGE_LOAD_TIMEOUT` | Page load timeout (ms) | `30000` |
| `ELEMENT_WAIT_TIMEOUT` | Element wait timeout (ms) | `10000` |

### Browser Settings

- **Headless Mode**: Set `BROWSER_HEADLESS=true` for background operation
- **Slow Mode**: Adjust `BROWSER_SLOW_MO` to control automation speed
- **Persistent Session**: Login session is saved in `browser-data/` directory

## Safety Features

- **Random Delays**: Built-in random delays to mimic human behavior
- **Rate Limiting**: Automatic delays between batch applications
- **Error Handling**: Comprehensive error handling with screenshots
- **Retry Logic**: Exponential backoff for failed operations
- **Session Management**: Persistent login to avoid repeated authentication

## Troubleshooting

### Common Issues

1. **Login Failed**
   - Check your LinkedIn credentials in `.env`
   - Ensure 2FA is disabled or use app passwords
   - Clear browser data: `rm -rf browser-data/`

2. **Job No Longer Accepting Applications**
   - Not all jobs support Easy Apply
   - Check if the job requires external application

3. **Form Fields Not Found**
   - LinkedIn may change their selectors
   - Check screenshots in `screenshots/` directory
   - Update selectors in `linkedinApply.ts`

4. **Browser Issues**
   - Update Playwright: `npx playwright install`
   - Clear browser cache: `rm -rf browser-data/`

### Debug Mode

Set `BROWSER_HEADLESS=false` to see the browser in action and debug issues.

## Development

### Building

```bash
npm run build
```

### Running Built Version

```bash
npm start
```

### TypeScript Compilation

The project uses TypeScript with strict mode enabled. All types are defined in `src/types.ts`.

## Security Notes

- ⚠️ **Never commit your `.env` file** - it contains sensitive credentials
- 🔒 Store credentials securely and use environment variables
- 🛡️ Consider using LinkedIn app passwords instead of your main password
- 📱 Be aware of LinkedIn's terms of service regarding automation

## Legal Disclaimer

This tool is for educational purposes. Please ensure compliance with:
- LinkedIn's Terms of Service
- Applicable laws and regulations
- Company policies regarding job applications

Use responsibly and at your own risk.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 