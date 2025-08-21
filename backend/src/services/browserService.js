const { spawn } = require('child_process');
const path = require('path');
const { supabase } = require('../config/database');
const { broadcastToUser } = require('../config/websocket');
const { chromium } = require('playwright');

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
  let browser = null;
  
  try {
    console.log(`🚀 Starting browser session initialization for user: ${userId}`);
    
    // Decrypt credentials
    const { decryptData } = require('../utils/encryption');
    const email = decryptData(credentials.email_encrypted);
    const password = decryptData(credentials.password_encrypted);
    
    if (!email || !password) {
      throw new Error('Failed to decrypt credentials');
    }
    
    console.log(`📧 Using email: ${email}`);
    console.log(`🔑 Password length: ${password.length} characters`);
    
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Navigate to LinkedIn login
    console.log('🌐 Navigating to LinkedIn login...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for login form
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.waitForSelector('#password', { timeout: 10000 });
    
    // Fill in credentials
    console.log('📝 Filling in login credentials...');
    await page.fill('#username', email);
    await page.fill('#password', password);
    
    // Click sign in button
    console.log('🔐 Clicking sign in button...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    // Check if login was successful
    const currentUrl = page.url();
    console.log(`📍 Current URL after login: ${currentUrl}`);
    
    // Check if we're on a checkpoint page
    if (currentUrl.includes('/checkpoint/')) {
      console.log('🛡️ LinkedIn security checkpoint detected');
      console.log('⚠️ Manual intervention required - please complete the checkpoint in the browser');
      
      // Wait for user to complete checkpoint manually
      console.log('⏳ Waiting for manual checkpoint completion...');
      
      // Wait up to 5 minutes for the user to complete the checkpoint
      const startTime = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes
      
      while (Date.now() - startTime < timeout) {
        await page.waitForTimeout(5000); // Check every 5 seconds
        
        const url = page.url();
        console.log(`📍 Current URL: ${url}`);
        
        // Check if we're no longer on a checkpoint page
        if (!url.includes('/checkpoint/')) {
          console.log('✅ Checkpoint appears to be completed');
          break;
        }
      }
      
      // Final check after timeout or completion
      const finalUrl = page.url();
      console.log(`📍 Final URL after checkpoint wait: ${finalUrl}`);
      
      if (finalUrl.includes('/checkpoint/')) {
        console.log('❌ Still on checkpoint page after timeout');
        throw new Error('Checkpoint not completed within timeout period');
      }
    }
    
    // Verify we're logged in
    const loginUrl = page.url();
    console.log(`📍 Final login URL: ${loginUrl}`);
    
    // Check if login was successful
    if (loginUrl.includes('/feed') || loginUrl.includes('/mynetwork') || 
        loginUrl.includes('/mynetwork/invite/') || loginUrl.includes('/messaging/') ||
        loginUrl.includes('/jobs/') || loginUrl.includes('/company/')) {
      console.log('✅ Successfully logged into LinkedIn');
    } else {
      // Try to detect if we're logged in by checking for common logged-in elements
      try {
        const isLoggedIn = await page.evaluate(() => {
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
          console.log('❌ Login failed - not on feed or mynetwork');
          console.log('Current page title:', await page.title());
          throw new Error('Login failed - not logged in');
        }
      } catch (error) {
        console.log('❌ Error checking login status:', error.message);
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
