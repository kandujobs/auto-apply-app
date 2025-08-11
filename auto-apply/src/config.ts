import dotenv from 'dotenv';
import path from 'path';
import { ApplicationConfig, LinkedInCredentials, BrowserConfig } from './types';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// LinkedIn Credentials
const credentials: LinkedInCredentials = {
  email: process.env.LINKEDIN_EMAIL || '',
  password: process.env.LINKEDIN_PASSWORD || '',
};

// Browser Configuration
const browser: BrowserConfig = {
  headless: process.env.BROWSER_HEADLESS === 'true',
  slowMo: parseInt(process.env.BROWSER_SLOW_MO || '1000'),
  pageLoadTimeout: parseInt(process.env.PAGE_LOAD_TIMEOUT || '30000'),
  elementWaitTimeout: parseInt(process.env.ELEMENT_WAIT_TIMEOUT || '10000'),
};

// Application Configuration
export const config: ApplicationConfig = {
  resumePath: process.env.RESUME_PATH || './resume.pdf',
  screenshotDir: process.env.SCREENSHOT_DIR || './screenshots',
  credentials,
  browser,
};

// Validation
export function validateConfig(): void {
  if (!config.credentials.email || !config.credentials.password) {
    throw new Error('LinkedIn credentials not found in environment variables. Please check your .env file.');
  }
  
  if (!config.resumePath) {
    throw new Error('Resume path not configured. Please set RESUME_PATH in your .env file.');
  }
}

// Export individual configs for convenience
export { credentials, browser }; 