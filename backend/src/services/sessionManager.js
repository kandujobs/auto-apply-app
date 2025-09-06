const { spawn } = require('child_process');
const path = require('path');
const { browserService } = require('./browserService');
const { decrypt } = require('../utils/encryption');
const { supabase } = require('../config/database');

// Session management
const activeSessions = new Map(); // userId -> sessionData

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
    return await browserService.startEasyApplyWorker(userId);
  }
};

function createSession(userId, ws) {
  const session = {
    isActive: true,
    websocket: ws,
    browserProcess: null,
    browserContext: null,
    browserPage: null,
    isLoggedIn: false,
    lastActivity: Date.now(),
    userId: userId,
    applicationProgress: '',
    questionQueue: [],
    currentQuestionIndex: 0,
    totalQuestions: 0,
    browserInstance: null, // Store the actual browser instance
    currentQuestion: null, // Store the current question being asked
    isBrowserRunning: false, // Track if browser is running for this session
    workerProcess: null // Track the worker process
  };

  activeSessions.set(userId, session);
  console.log(`🔐 Session created for user: ${userId}`);
  return session;
}

async function endSession(userId) {
  const session = activeSessions.get(userId);
  if (session) {
    console.log(`🔚 Ending session for user: ${userId}`);
    
    // Kill the worker process if it exists
    if (session.workerProcess) {
      try {
        session.workerProcess.kill();
        console.log(`🔚 Killed worker process for user: ${userId}`);
      } catch (error) {
        console.error(`❌ Error killing worker process for user ${userId}:`, error);
      }
    }
    
    // Close browser instance if it exists
    if (session.browserInstance) {
      try {
        await session.browserInstance.close();
        console.log(`🔚 Closed browser instance for user: ${userId}`);
      } catch (error) {
        console.error(`❌ Error closing browser instance for user ${userId}:`, error);
      }
    }
    
    // Remove from application queue
    if (applicationQueue.workerProcesses[userId]) {
      delete applicationQueue.workerProcesses[userId];
      console.log(`🔚 Removed from application queue for user: ${userId}`);
    }
    
    // Clean up job fetch state
    jobFetchInProgress.delete(userId);
    jobFetchQueue.delete(userId);
    console.log(`🔚 Cleaned up job fetch state for user: ${userId}`);
    
    activeSessions.delete(userId);
    console.log(`✅ Session ended for user: ${userId}`);
  }
}

function getSession(userId) {
  return activeSessions.get(userId);
}

function isSessionActive(userId) {
  const session = activeSessions.get(userId);
  return !!(session && session.isActive);
}

function isBrowserRunningForSession(userId) {
  const session = activeSessions.get(userId);
  return !!(session && session.isBrowserRunning);
}

function updateSessionActivity(userId) {
  const session = activeSessions.get(userId);
  if (session) {
    session.lastActivity = Date.now();
  }
}

// Function to start a session with browser initialization
async function startSessionWithBrowser(userId) {
  try {
    console.log(`🚀 Starting session with browser for user: ${userId}`);
    
    // Check if session already exists
    if (isSessionActive(userId)) {
      console.log(`⚠️ Session already active for user: ${userId}`);
      return {
        success: true,
        message: 'Session already active',
        sessionActive: true,
        browserRunning: isBrowserRunningForSession(userId)
      };
    }
    
    // Get LinkedIn credentials for this user
    const { data: credentials, error: credentialsError } = await supabase
      .from('linkedin_credentials')
      .select('email, password_encrypted')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (credentialsError || !credentials) {
      console.error('Credentials error:', credentialsError);
      console.log('Credentials data:', credentials);
      return {
        success: false,
        error: 'LinkedIn credentials not found. Please add your LinkedIn credentials first.'
      };
    }
    
    console.log('Found credentials, attempting to decrypt password...');
    console.log('Password encrypted format:', typeof credentials.password_encrypted);
    console.log('Password encrypted preview:', credentials.password_encrypted ? credentials.password_encrypted.substring(0, 50) + '...' : 'null');
    
    // Decrypt password
    let decryptedPassword;
    try {
      decryptedPassword = await decrypt(credentials.password_encrypted);
      console.log('Password decryption attempted');
      
      if (!decryptedPassword) {
        console.error('❌ Password decryption returned null - likely wrong data format');
        return {
          success: false,
          error: 'LinkedIn credentials are in an invalid format. Please update your credentials in the database.',
          details: 'Password decryption failed - data format issue'
        };
      }
      
      console.log('Password decrypted successfully');
      console.log(`Password length: ${decryptedPassword.length} characters`);
      console.log(`Password preview: ${decryptedPassword.substring(0, 3) + '***'}`);
      
      // Validate password length for LinkedIn
      if (decryptedPassword.length > 50) {
        console.error(`❌ Password is unreasonably long (${decryptedPassword.length} chars) - this is not a real password`);
        return {
          success: false,
          error: 'LinkedIn credentials are corrupted. Please update your credentials.',
          details: `Password is too long (${decryptedPassword.length} chars) - likely wrong data format`
        };
      }
      
    } catch (decryptError) {
      console.error('Failed to decrypt password:', decryptError);
      return {
        success: false,
        error: 'Failed to decrypt LinkedIn credentials. Please update your credentials.',
        details: decryptError.message
      };
    }
    
    if (!decryptedPassword) {
      return {
        success: false,
        error: 'LinkedIn password could not be decrypted. Please update your credentials.'
      };
    }
    
    // Find any existing WebSocket connection for this user
    const { connectedClients } = require('../config/websocket');
    let existingWebSocket = null;
    
    connectedClients.forEach(client => {
      if (client.userId === userId && client.readyState === 1) {
        existingWebSocket = client;
        console.log(`🔗 Found existing WebSocket connection for user: ${userId}`);
      }
    });
    
    // Create new session with existing WebSocket if found
    const session = createSession(userId, existingWebSocket);
    
    // Initialize browser session
    try {
      const initResult = await browserService.initializeBrowserSession(userId, {
        email: credentials.email,
        password: decryptedPassword
      });
      
      if (initResult.success) {
        // Store browser instance in session
        session.browserInstance = initResult.browser;
        session.browserContext = initResult.context;
        session.browserPage = initResult.page;
        session.isBrowserRunning = true;
        session.isLoggedIn = true;
        session.lastActivity = Date.now();
        
        console.log(`✅ Session started successfully for user: ${userId}`);
        
        // Send progress update
        browserService.sendProgressToSession(userId, '✅ Session ready - browser is logged in and ready for applications');
    
        return {
          success: true,
          message: 'Session started successfully',
          sessionActive: true,
          browserRunning: true,
          ready: initResult.ready || false
        };
      } else {
        throw new Error('Browser initialization failed');
      }
    } catch (error) {
      console.error(`❌ Failed to start session for user ${userId}:`, error);
      
      // Clean up any partial session
      try {
        await endSession(userId);
      } catch (cleanupError) {
        console.error('Error cleaning up session:', cleanupError);
      }
      
      return {
        success: false,
        error: 'Failed to start session',
        details: error.message
      };
    }
    
  } catch (error) {
    console.error('Error in startSessionWithBrowser:', error);
    return {
      success: false,
      error: 'Failed to start session',
      details: error.message
    };
  }
}

// Function to fetch jobs using the session browser
async function fetchJobsForSession(userId, searchParams = {}) {
  try {
    return await browserService.fetchJobsWithSessionBrowser(userId, searchParams);
  } catch (error) {
    console.error('Error fetching jobs for session:', error);
    throw error;
  }
}

// Function to answer application questions
async function answerQuestionForSession(userId, answer) {
  try {
    return await browserService.answerApplicationQuestion(userId, answer);
  } catch (error) {
    console.error('Error answering question for session:', error);
    throw error;
  }
}

// Periodic cleanup of stale sessions
setInterval(() => {
  const now = Date.now();
  const staleSessions = [];
  
  for (const [userId, session] of activeSessions) {
    // End sessions that have been inactive for more than 5 minutes
    if (now - session.lastActivity > 300000) { // 5 minutes
      console.log(`🧹 Cleaning up stale session for user: ${userId}`);
      staleSessions.push(userId);
    }
  }
  
  // End stale sessions
  staleSessions.forEach(userId => {
    endSession(userId);
  });
  
  if (staleSessions.length > 0) {
    console.log(`🧹 Cleaned up ${staleSessions.length} stale sessions`);
  }
}, 60000); // Check every minute

const sessionManager = {
  createSession,
  endSession,
  getSession,
  isSessionActive,
  isBrowserRunningForSession,
  updateSessionActivity,
  startSessionWithBrowser,
  fetchJobsForSession,
  answerQuestionForSession,
  activeSessions,
  jobFetchInProgress,
  jobFetchQueue,
  applicationQueue
};

module.exports = { sessionManager };
