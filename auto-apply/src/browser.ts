import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import { config } from './config.js';
import { log, randomDelay } from './utils.js';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let isQueueMode = false;

/**
 * Initialize browser with persistent context for login session
 */
async function initializeBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
  try {
    log('Initializing browser...');
    
    browser = await chromium.launch({
      headless: false, // Run in non-headless mode to avoid detection
      slowMo: 50, // Add realistic delays
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--no-zygote',
        '--single-process',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
    
    // Create context with stealth settings
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    log('Browser initialized successfully');
    return { browser, context };
  } catch (error) {
    log(`❌ Error initializing browser: ${error}`, 'error');
    throw error;
  }
}

/**
 * Set queue mode (prevents browser from closing after each job)
 */
export function setQueueMode(enabled: boolean): void {
  isQueueMode = enabled;
  log(`Queue mode ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get or create a new page
 */
export async function getPage(): Promise<Page> {
  if (!browser) {
    log('Initializing browser...');
    
    browser = await chromium.launch({
      headless: false, // Run in non-headless mode to avoid detection
      slowMo: 50, // Add realistic delays
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--no-zygote',
        '--single-process',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
    
    // Create context with stealth settings
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    log('Browser initialized successfully');
  }
  
  if (!browser || !context) {
    throw new Error('Failed to initialize browser');
  }
  
  const page = await context.newPage();
  
  // Add stealth scripts to avoid detection
  await page.addInitScript(() => {
    // Override webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Override plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    // Override permissions
    Object.defineProperty(navigator, 'permissions', {
      get: () => ({
        query: () => Promise.resolve({ state: 'granted' })
      }),
    });
    
    // Override chrome
    Object.defineProperty(window, 'chrome', {
      get: () => ({
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {}
      }),
    });
  });
  
  return page;
}

/**
 * Get or create a new page in a new tab (for queue mode)
 */
export async function getNewTabPage(): Promise<Page> {
  if (!browser || !context) {
    throw new Error('Browser not initialized');
  }
  
  const page = await context.newPage();
  
  // Add stealth scripts to avoid detection
  await page.addInitScript(() => {
    // Override webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Override plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    
    // Override permissions
    Object.defineProperty(navigator, 'permissions', {
      get: () => ({
        query: () => Promise.resolve({ state: 'granted' })
      }),
    });
    
    // Override chrome
    Object.defineProperty(window, 'chrome', {
      get: () => ({
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {}
      }),
    });
  });

  return page;
}

/**
 * Check if user is logged into LinkedIn
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await randomDelay(1000, 2000);
    
    // Check for login indicators
    const isLoggedIn = await page.evaluate(() => {
      // Check if we're redirected to login page
      if (window.location.href.includes('/login')) {
        return false;
      }
      
      // Check for feed elements that indicate successful login
      const feedElements = document.querySelectorAll('[data-test-id="feed-identity-module"], .feed-identity-module, [data-testid="global-nav"], .global-nav');
      return feedElements.length > 0;
    });

    return isLoggedIn;
  } catch (error) {
    log(`Error checking login status: ${error}`, 'error');
    return false;
  }
}

/**
 * Login to LinkedIn
 */
export async function loginToLinkedIn(page: Page): Promise<boolean> {
  try {
    log('Attempting to login to LinkedIn...');
    
    // Get credentials from environment variables (set by the worker)
    const email = process.env.LINKEDIN_EMAIL;
    const password = process.env.LINKEDIN_PASSWORD;
    
    if (!email || !password) {
      log('LinkedIn credentials not found in environment variables', 'error');
      return false;
    }
    
    log(`Using email: ${email}`);
    
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await randomDelay(1000, 2000);

    // Fill in email
    await page.fill('#username', email);
    await randomDelay(500, 1000);

    // Fill in password
    await page.fill('#password', password);
    await randomDelay(500, 1000);

    // Click sign in button
    await page.click('button[type="submit"]');
    await randomDelay(3000, 5000);

    // Wait for navigation with a more reasonable timeout
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    } catch (error) {
      log('Timeout waiting for page load, continuing anyway...', 'warn');
    }
    
    // Check if we're redirected to feed (successful login)
    const currentUrl = page.url();
    if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
      log('Successfully logged into LinkedIn');
      return true;
    }

    // Check for error messages
    const errorElement = await page.$('.alert-error, .error-for-password, .error-for-username');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      log(`Login failed: ${errorText}`, 'error');
      return false;
    }

    log('Login status unclear, checking feed...', 'warn');
    return await isLoggedIn(page);
    
  } catch (error) {
    log(`Login error: ${error}`, 'error');
    return false;
  }
}

/**
 * Ensure user is logged in, login if necessary
 */
export async function ensureLoggedIn(page: Page): Promise<boolean> {
  try {
    const loggedIn = await isLoggedIn(page);
    
    if (!loggedIn) {
      log('Not logged in, attempting to login...');
      return await loginToLinkedIn(page);
    }
    
    log('Already logged into LinkedIn');
    return true;
  } catch (error) {
    log(`Error ensuring login: ${error}`, 'error');
    return false;
  }
}

/**
 * Close browser and context
 */
export async function closeBrowser(): Promise<void> {
  // Don't close browser in queue mode
  if (isQueueMode) {
    log('Skipping browser close in queue mode');
    return;
  }
  
  if (context) {
    await context.close();
    context = null;
  }
  
  if (browser) {
    await browser.close();
    browser = null;
  }
  
  log('Browser closed');
}

/**
 * Get browser instance (for cleanup purposes)
 */
export function getBrowser(): Browser | null {
  return browser;
}

/**
 * Get context instance (for cleanup purposes)
 */
export function getContext(): BrowserContext | null {
  return context;
} 