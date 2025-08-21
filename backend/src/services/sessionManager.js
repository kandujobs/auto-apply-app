const { spawn } = require('child_process');
const path = require('path');

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
    // This would be implemented to start the worker process
    // For now, return a mock response
    return { success: true, message: 'Worker started' };
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
  activeSessions,
  jobFetchInProgress,
  jobFetchQueue,
  applicationQueue
};

module.exports = { sessionManager };
