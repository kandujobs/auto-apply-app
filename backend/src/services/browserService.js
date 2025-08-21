const { spawn } = require('child_process');
const path = require('path');
const { supabase } = require('../config/database');
const { broadcastToUser } = require('../config/websocket');
const { checkpointPortalService } = require('./checkpointPortalService');

// Load Playwright conditionally
let chromium;
try {
  const playwright = require('playwright');
  chromium = playwright.chromium;
  console.log('✅ Playwright loaded successfully');
} catch (error) {
  console.warn('⚠️ Playwright not available:', error.message);
  console.log('🔧 Auto-apply features will be disabled');
}

// Global variables to track application status
let currentApplicationStatus = 'idle';
let currentApplicationProgress = '';
let currentApplicationOutput = '';
let totalQuestions = 0; // Total number of questions found

// Job fetching state management
let jobFetchInProgress = new Map(); // userId -> boolean
let jobFetchQueue = new Map(); // userId -> Array of pending requests

// Application queue for managing worker processes
const applicationQueue = {
  isProcessing: false,
  queue: [],
  completedJobs: [],
  workerProcesses: {},
  
  isBrowserRunning(userId) {
    return !!(this.workerProcesses && this.workerProcesses[userId]);
  },
  
  async startEasyApplyWorker(userId) {
    // This would be implemented to start the worker process
    // For now, return a mock response
    return { success: true, message: 'Worker started' };
  }
};

// Function to send progress updates to session
function sendProgressToSession(userId, message) {
  console.log(`📤 [${userId}] ${message}`);
  broadcastToUser(userId, {
    type: 'progress',
    message: message,
    timestamp: new Date().toISOString()
  });
}

// Function to send answer back to the browser process
function sendAnswerToBrowser(answer, currentQuestion = null) {
  // Write answer to file for Playwright script to read
  const fs = require('fs');
  const answerData = {
    answer: answer,
    question: currentQuestion,
    timestamp: new Date().toISOString()
  };
  
  try {
    fs.writeFileSync(path.join(__dirname, '../answer.json'), JSON.stringify(answerData, null, 2));
    console.log('✅ Answer sent to browser process');
  } catch (error) {
    console.error('❌ Error sending answer to browser:', error);
  }
}

// Function to initialize browser session (login and checkpoint handling)
async function initializeBrowserSession(userId, credentials) {
  try {
    console.log(`🔐 Initializing browser session for user: ${userId}`);
    
    let browser = null;
    let context = null;
    let page = null;
    
    try {
      if (!chromium) {
        throw new Error('Playwright not available');
      }
      
      console.log('🚀 Starting browser...');
      
      browser = await chromium.launch({
        headless: true, // Changed to true for server environment
        slowMo: 1000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      page = await context.newPage();
      
      // Navigate to LinkedIn login
      console.log('🌐 Navigating to LinkedIn login...');
      await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Wait for login form to load
      console.log('⏳ Waiting for login form...');
      await page.waitForSelector('#username', { timeout: 10000 });
      await page.waitForSelector('#password', { timeout: 10000 });
      
      // Fill in credentials
      console.log('🔐 Filling in credentials...');
      await page.fill('#username', credentials.email);
      await page.fill('#password', credentials.password);
      
      // Click sign in button
      console.log('🔘 Clicking sign in...');
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      console.log('⏳ Waiting for login response...');
      await page.waitForLoadState('domcontentloaded');
      
      // Get current URL after login attempt
      const loginUrl = page.url();
      console.log(`📍 Current URL after login: ${loginUrl}`);
      
      // Check for security checkpoints first (before checking for errors)
      const securityCheckpointSelectors = [
        'div[data-test-id="challenge-dialog"]',
        'div[data-test-id="security-verification"]',
        'div[data-test-id="captcha-challenge"]',
        'iframe[src*="recaptcha"]',
        'div[data-test-id="challenge"]',
        'div[data-test-id="verification"]',
        'div[data-test-id="security"]',
        'div[data-test-id="checkpoint"]',
        'div[data-test-id="challenge-dialog"]',
        'div[data-test-id="security-verification"]',
        'div[data-test-id="captcha-challenge"]',
        'iframe[src*="recaptcha"]',
        'div[data-test-id="challenge"]',
        'div[data-test-id="verification"]',
        'div[data-test-id="security"]',
        'div[data-test-id="checkpoint"]'
      ];
      
      let hasSecurityCheckpoint = false;
      
      // Check URL for security checkpoint indicators
      if (loginUrl.includes('/checkpoint') || loginUrl.includes('/challenge') || loginUrl.includes('/security')) {
        console.log(`🛡️ Security checkpoint detected in URL: ${loginUrl}`);
        hasSecurityCheckpoint = true;
      }
      
      // Check for security checkpoint elements on the page
      for (const selector of securityCheckpointSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`🛡️ Security checkpoint detected: ${selector}`);
            hasSecurityCheckpoint = true;
            break;
          }
        } catch (error) {
          // Element not found, continue checking
        }
      }
      
      // If we have a security checkpoint, handle it immediately (don't check for errors)
      if (hasSecurityCheckpoint) {
        console.log('🛡️ LinkedIn security checkpoint detected. Please complete it manually...');
        console.log('⏳ Starting checkpoint portal for user interaction...');
        
        // Start checkpoint portal for user interaction
        await checkpointPortalService.startPortal(userId, loginUrl);
        
        // Wait for user to complete security checkpoint
        console.log('⏳ Waiting for user to complete security checkpoint...');
        await checkpointPortalService.waitForCompletion(userId, 300000); // 5 minutes timeout
        
        console.log('✅ Security checkpoint completed by user');
        
        // Check if we're now logged in
        const currentUrl = page.url();
        console.log(`📍 Current URL after checkpoint: ${currentUrl}`);
        
        // Wait a bit longer for any redirects to complete
        await page.waitForTimeout(3000);
        
        // Check the URL again after waiting
        const finalUrl = page.url();
        console.log(`📍 Final URL after checkpoint wait: ${finalUrl}`);
        
        // Check if we're still on a checkpoint page
        if (finalUrl.includes('/checkpoint/')) {
          console.log('❌ Still on checkpoint page after completion attempt');
          console.log('⚠️ This might indicate the checkpoint wasn\'t properly completed');
          throw new Error('Checkpoint not completed - still on checkpoint page');
        }
        
        // Check if we're now logged in (more comprehensive check)
        if (finalUrl.includes('/feed') || finalUrl.includes('/mynetwork') || 
            finalUrl.includes('/mynetwork/invite/') || finalUrl.includes('/messaging/') ||
            finalUrl.includes('/jobs/') || finalUrl.includes('/company/')) {
          console.log('✅ Successfully logged into LinkedIn after security checkpoint');
        } else {
          console.log('❌ Still not logged in after security checkpoint');
          console.log('📍 Current page title:', await page.title());
          
          // Try to detect if we're logged in by checking for common logged-in elements
          try {
            const isLoggedIn = await page.evaluate(() => {
              // Check for elements that indicate we're logged in
              return !!(
                document.querySelector('[data-control-name="identity_welcome_message"]') ||
                document.querySelector('[data-control-name="nav.settings"]') ||
                document.querySelector('[data-control-name="nav.messaging"]') ||
                document.querySelector('[data-control-name="nav.notifications"]') ||
                document.querySelector('.global-nav') ||
                document.querySelector('[aria-label="LinkedIn"]')
              );
            });
            
            if (isLoggedIn) {
              console.log('✅ Login detected via page elements');
            } else {
              console.log('❌ No login indicators found on page');
              throw new Error('Login failed after security checkpoint - no login indicators found');
            }
          } catch (error) {
            console.log('❌ Error checking login status:', error.message);
            throw new Error('Login failed after security checkpoint');
          }
        }
      } else {
        // Only check for error messages if we don't have a security checkpoint
        try {
          const errorElements = await page.locator('.alert-error, .error, [role="alert"]').all();
          if (errorElements.length > 0) {
            for (const errorElement of errorElements) {
              const errorText = await errorElement.textContent();
              console.log(`⚠️ Login error detected: ${errorText}`);
            }
          }
        } catch (error) {
          console.log('No error elements found');
        }
        
        // Check if login was successful (only if no checkpoint)
        if (loginUrl.includes('/feed') || loginUrl.includes('/mynetwork')) {
          console.log('✅ Successfully logged into LinkedIn');
        } else {
          console.log('❌ Login failed - not on feed or mynetwork');
          console.log('Current page title:', await page.title());
          
          // Check if we're still on the login page
          if (loginUrl.includes('/login')) {
            console.log('Still on login page - login may have failed');
            throw new Error('Login failed - still on login page');
          }
          
          throw new Error('Login failed');
        }
      }
      
      // Wait like a human would
      await page.waitForTimeout(5000);
      
      // Navigate to feed to ensure we're ready for applications
      console.log('🌐 Navigating to LinkedIn feed...');
      await page.goto('https://www.linkedin.com/feed', { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('✅ Successfully navigated to LinkedIn feed');
      
      // Wait for page to load
      await page.waitForTimeout(3000);
      
      console.log('🎉 Browser session initialization completed successfully!');
      console.log('🌐 Browser is now ready for job applications');
      
      return { 
        success: true, 
        browser: browser,
        context: context,
        page: page,
        ready: true 
      };
      
    } catch (error) {
      console.log(`❌ Error during browser session initialization: ${error}`);
      // Clean up browser if it was created
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in browser session initialization:', error);
    throw error;
  }
}

// Function to fetch jobs using the session browser
async function fetchJobsWithSessionBrowser(userId, searchParams = {}) {
  try {
    const session = require('./sessionManager').sessionManager.getSession(userId);
    
    // Check if user has an active session with browser
    if (!session || !session.isBrowserRunning || !session.browserPage) {
      throw new Error('No active browser session found. Please start a session first.');
    }
    
    // Additional check to ensure the browser page is still valid
    try {
      await session.browserPage.evaluate(() => document.title);
    } catch (error) {
      console.log(`❌ Browser page is closed for user: ${userId}`);
      throw new Error('Browser session has been closed. Please start a new session first.');
    }
    
    // Use the existing session browser to fetch jobs with progress tracking
    console.log('🔄 Starting job fetch with session browser...');
    sendProgressToSession(userId, '🔄 Starting job fetch...');
    
    const page = session.browserPage;
    
    // Build search URL
    const baseUrl = 'https://www.linkedin.com/jobs/search/';
    const searchParams = new URLSearchParams({
      keywords: searchParams.keywords || 'software engineer',
      location: searchParams.location || 'United States',
      f_WT: '2', // Remote
      f_E: '2', // Entry level
      f_JT: 'F', // Full-time
      position: '1',
      pageNum: '0'
    });
    
    const searchUrl = `${baseUrl}?${searchParams.toString()}`;
    console.log(`🔍 Searching jobs at: ${searchUrl}`);
    
    // Navigate to job search page
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    await page.waitForTimeout(3000); // Give time for jobs to load
    
    // Extract jobs from the page
    console.log('🔍 Extracting jobs from page...');
    sendProgressToSession(userId, '🔍 Extracting jobs from page...');
    
    const jobs = await extractJobsFromPage(page, userId);
    
    console.log(`✅ Successfully extracted ${jobs.length} jobs`);
    sendProgressToSession(userId, `✅ Successfully extracted ${jobs.length} jobs`);
    
    return {
      success: true,
      jobs: jobs,
      count: jobs.length
    };
    
  } catch (error) {
    console.error('Error fetching jobs with session browser:', error);
    
    // Check if the error is due to a closed browser
    if (error.message.includes('Target page, context or browser has been closed') ||
        error.message.includes('Browser page has been closed')) {
      sendProgressToSession(userId, '❌ Browser session was closed. Please start a new session.');
      
      // Send WebSocket message to notify frontend of browser closure
      broadcastToUser(userId, {
        type: 'browser_closed',
        message: 'Browser session was closed. Please start a new session.'
      });
      
      throw new Error('Browser session was closed. Please start a new session to fetch jobs.');
    }
    
    throw error;
  }
}

// Function to extract jobs from a LinkedIn page
async function extractJobsFromPage(page, userId) {
  const jobs = [];
  
  try {
    // Wait for job cards to load
    await page.waitForSelector('a.job-card-container__link', { timeout: 10000 });
    
    // Get all job cards
    let jobCards = await page.locator('a.job-card-container__link').all();
    
    // If no job cards found, try alternative selectors
    if (jobCards.length === 0) {
      console.log('No job cards found with primary selector, trying alternatives...');
      const alternativeCards = await page.locator('[data-control-name="jobsearch_job_resultcard"]').all();
      if (alternativeCards.length > 0) {
        jobCards = alternativeCards;
      }
    }
    
    // If still no cards, try a more general approach
    if (jobCards.length === 0) {
      console.log('Trying general job link selector...');
      const allJobLinks = await page.locator('a[href*="/jobs/view/"]').all();
      if (allJobLinks.length > 0) {
        jobCards = allJobLinks;
      }
    }
    
    console.log(`Found ${jobCards.length} job cards`);
    sendProgressToSession(userId, `Found ${jobCards.length} job cards`);
    
    // Verify we have job cards
    const finalJobCount = await page.locator('a.job-card-container__link').count();
    if (finalJobCount === 0) {
      console.log('No job cards found on page');
      sendProgressToSession(userId, 'No job cards found on page');
      return jobs;
    }
    
    // Extract job information from each card
    for (let i = 0; i < Math.min(jobCards.length, 15); i++) {
      try {
        // Check if browser is still valid
        await page.evaluate(() => document.title);
        
        console.log(`Extracting job ${i + 1}/${Math.min(jobCards.length, 15)}`);
        sendProgressToSession(userId, `Extracting job ${i + 1}/${Math.min(jobCards.length, 15)}`);
        
        // Get current job cards (they might change as we navigate)
        const currentJobCards = await page.locator('a.job-card-container__link').all();
        
        if (i >= currentJobCards.length) {
          console.log(`Job card ${i} not found, stopping extraction`);
          break;
        }
        
        // Extract basic job info from the card
        const basicJobInfo = await page.evaluate((index) => {
          const cards = document.querySelectorAll('a.job-card-container__link');
          if (index >= cards.length) return null;
          
          const card = cards[index];
          const titleElement = card.querySelector('.job-card-list__title');
          const companyElement = card.querySelector('.job-card-container__company-name');
          const locationElement = card.querySelector('.job-card-container__metadata-item');
          
          return {
            title: titleElement ? titleElement.textContent.trim() : 'Not available',
            company: companyElement ? companyElement.textContent.trim() : 'Not available',
            location: locationElement ? locationElement.textContent.trim() : 'Not available',
            url: card.href
          };
        }, i);
        
        if (!basicJobInfo) {
          console.log(`Could not extract basic info for job ${i}`);
          continue;
        }
        
        // Click on the job card to open details
        await currentJobCards[i].click();
        await page.waitForTimeout(1000); // Reduced wait time for FAST MODE
        
        // Wait for job details to load
        try {
          await page.waitForSelector('.jobs-description__content, .job-details-jobs-unified-top-card__job-description__content, .jobs-unified-top-card__job-description__content', { timeout: 2000 });
        } catch (error) {
          console.log(`Job details not loaded for job ${i}, skipping...`);
          continue;
        }
        
        // Extract detailed job information
        const jobDetails = await page.evaluate(() => {
          const descriptionElement = document.querySelector('.jobs-description__content, .job-details-jobs-unified-top-card__job-description__content, .jobs-unified-top-card__job-description__content');
          const description = descriptionElement ? descriptionElement.textContent.trim() : 'Not available';
          
          // Check for Easy Apply button
          const easyApplyButton = document.querySelector('button[aria-label="Easy Apply"], button:has-text("Easy Apply")');
          const hasEasyApply = !!easyApplyButton;
          
          // Extract job ID from URL
          const url = window.location.href;
          const jobIdMatch = url.match(/\/jobs\/view\/(\d+)/);
          const jobId = jobIdMatch ? jobIdMatch[1] : null;
          
          return {
            description,
            hasEasyApply,
            jobId,
            url: window.location.href
          };
        });
        
        // Combine basic and detailed info
        const jobInfo = {
          ...basicJobInfo,
          ...jobDetails,
          id: jobDetails.jobId || `job_${i}_${Date.now()}`,
          extracted_at: new Date().toISOString()
        };
        
        jobs.push(jobInfo);
        
        // Store job in database
        try {
          const { error } = await supabase
            .from('linkedin_fetched_jobs')
            .insert({
              user_id: userId,
              job_id: jobInfo.id,
              job_title: jobInfo.title,
              company_name: jobInfo.company,
              location: jobInfo.location,
              description: jobInfo.description,
              job_url: jobInfo.url,
              has_easy_apply: jobInfo.hasEasyApply,
              extracted_at: jobInfo.extracted_at
            });
          
          if (error) {
            console.error('Error storing job in database:', error);
          }
        } catch (dbError) {
          console.error('Error storing job in database:', dbError);
        }
        
        await page.waitForTimeout(1000); // Wait between job extractions
        
      } catch (error) {
        console.error(`Error extracting job ${i}:`, error);
        continue;
      }
    }
    
    // Try to go to next page if available
    try {
      const nextButton = await page.$('button[aria-label="Next"]');
      if (nextButton) {
        console.log('Next page available, but stopping here for now');
        sendProgressToSession(userId, 'Next page available, but stopping here for now');
      }
    } catch (error) {
      console.log('No next page available');
    }
    
  } catch (error) {
    console.error('Error in extractJobsFromPage:', error);
    throw error;
  }
  
  return jobs;
}

// Function to start easy apply worker
async function startEasyApplyWorker(userId) {
  try {
    console.log(`🚀 Starting Easy Apply worker for user: ${userId}`);
    
    // Check if user has an active session
    const session = require('./sessionManager').sessionManager.getSession(userId);
    if (!session || !session.isBrowserRunning) {
      throw new Error('No active session found. Please start a session first.');
    }
    
    // Set up environment variables for the worker
    const env = {
      ...process.env,
      USER_ID: userId,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      BROWSER_HEADLESS: 'false',
      BROWSER_SLOW_MO: '1000',
      PAGE_LOAD_TIMEOUT: '30000',
      ELEMENT_WAIT_TIMEOUT: '10000'
    };
    
    // Start the worker process
    const workerPath = path.join(__dirname, '../auto-apply-worker.js');
    const workerProcess = spawn('node', [workerPath], {
      env: env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Store the worker process in the session
    session.workerProcess = workerProcess;
    applicationQueue.workerProcesses[userId] = workerProcess;
    
    // Handle worker output
    workerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Worker ${userId}] ${output}`);
      
      // Parse progress updates
      if (output.includes('Progress:')) {
        const progressMatch = output.match(/Progress: (.+)/);
        if (progressMatch) {
          sendProgressToSession(userId, progressMatch[1]);
        }
      }
      
      // Parse question updates
      if (output.includes('Question:')) {
        const questionMatch = output.match(/Question: (.+)/);
        if (questionMatch) {
          const question = JSON.parse(questionMatch[1]);
          broadcastToUser(userId, {
            type: 'question',
            question: question,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    workerProcess.stderr.on('data', (data) => {
      console.error(`[Worker ${userId}] Error: ${data.toString()}`);
    });
    
    workerProcess.on('close', (code) => {
      console.log(`[Worker ${userId}] Process exited with code ${code}`);
      delete applicationQueue.workerProcesses[userId];
      if (session.workerProcess === workerProcess) {
        session.workerProcess = null;
      }
    });
    
    return { success: true, message: 'Easy Apply worker started successfully' };
    
  } catch (error) {
    console.error('Error starting Easy Apply worker:', error);
    throw error;
  }
}

// Function to answer application questions
async function answerApplicationQuestion(userId, answer) {
  try {
    console.log(`📝 Processing answer for user: ${userId}`);
    
    // Send answer to browser process
    sendAnswerToBrowser(answer);
    
    // Update session progress
    const session = require('./sessionManager').sessionManager.getSession(userId);
    if (session) {
      session.currentQuestionIndex++;
      session.lastActivity = Date.now();
      
      // Send progress update
      broadcastToUser(userId, {
        type: 'question_answered',
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions,
        timestamp: new Date().toISOString()
      });
    }
    
    return { success: true, message: 'Answer processed successfully' };
    
  } catch (error) {
    console.error('Error processing answer:', error);
    throw error;
  }
}

const browserService = {
  initializeBrowserSession,
  fetchJobsWithSessionBrowser,
  extractJobsFromPage,
  startEasyApplyWorker,
  answerApplicationQuestion,
  sendProgressToSession,
  sendAnswerToBrowser,
  applicationQueue,
  jobFetchInProgress,
  jobFetchQueue,
  currentApplicationStatus,
  currentApplicationProgress,
  currentApplicationOutput,
  totalQuestions
};

module.exports = { browserService };
