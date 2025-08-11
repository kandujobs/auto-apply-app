import fs from 'fs';
import path from 'path';
import { Page } from 'playwright';

/**
 * Utility function to add random delays to avoid detection
 */
export function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Utility function to wait for a specific amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Take a screenshot and save it to the specified directory
 */
export async function takeScreenshot(
  page: Page, 
  filename: string, 
  screenshotDir: string = './screenshots'
): Promise<string> {
  try {
    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotDir, `${filename}_${timestamp}.png`);
    
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true 
    });
    
    console.log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    console.error('Failed to take screenshot:', error);
    throw error;
  }
}

/**
 * Log messages with timestamps
 */
export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  }[level];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Validate if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Extract job ID from LinkedIn URL
 */
export function extractJobId(url: string): string | null {
  const match = url.match(/\/jobs\/view\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Sanitize filename for safe file operations
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Format date for logging
 */
export function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries - 1) throw lastError;
      
      const delay = baseDelay * Math.pow(2, i);
      log(`Attempt ${i + 1} failed: ${lastError.message}, retrying in ${delay}ms...`, 'warn');
      await wait(delay);
    }
  }
  
  throw lastError!;
} 