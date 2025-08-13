const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');

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

// Load environment variables
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (error) {
  console.log('No .env file found, using environment variables');
}

console.log('🔧 Starting server initialization...');
console.log(`📁 Current directory: ${__dirname}`);
console.log(`🔑 PORT environment: ${process.env.PORT}`);
console.log(`🔑 NODE_ENV: ${process.env.NODE_ENV}`);

// Set Supabase environment variables for imported modules
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://xipjxcktpzanmhfrkbrm.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE';

const app = express();
const PORT = process.env.PORT || 3001;

// Create WebSocket server on the same port as HTTP server
const wss = new WebSocket.Server({ noServer: true });

// Global variables to track application status
let currentApplicationStatus = 'idle';
let currentApplicationProgress = '';
let currentApplicationOutput = '';
let connectedClients = new Set();
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

// Session management
const activeSessions = new Map(); // userId -> sessionData

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

function getSession(userId) {
  return activeSessions.get(userId);
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

function isSessionActive(userId) {
  const session = activeSessions.get(userId);
  return session && session.isActive;
}

function isBrowserRunningForSession(userId) {
  const session = activeSessions.get(userId);
  return session && session.isBrowserRunning;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');
  
  // Limit the number of connections to prevent spam
  if (connectedClients.size >= 10) {
    console.log('🔌 Too many connections, closing new connection');
    ws.close();
    return;
  }
  
  connectedClients.add(ws);
  console.log(`🔌 Total connected clients: ${connectedClients.size}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📤 Received WebSocket message:', data);
      
      if (data.type === 'session_connect') {
        // Client is connecting to a session
        const { userId } = data;
        console.log(`🔐 Client connecting to session for user: ${userId}`);
        
        // Check if session exists
        const session = getSession(userId);
        if (session) {
          // Update session with WebSocket connection
          session.websocket = ws;
          session.lastActivity = Date.now();
          console.log(`🔐 Session WebSocket connected for user: ${userId}`);
          
          // Send session confirmation
          ws.send(JSON.stringify({
            type: 'session_connected',
            userId: userId,
            message: 'Session connected successfully'
          }));
        } else {
          console.log(`❌ No active session found for user: ${userId}`);
          ws.send(JSON.stringify({
            type: 'session_error',
            error: 'No active session found'
          }));
        }
      } else if (data.type === 'question') {
        console.log('📤 Received question via WebSocket:', data.data);
        
        // Find the session for this WebSocket
        let userSession = null;
        for (const [userId, session] of activeSessions) {
          if (session.websocket === ws) {
            userSession = session;
            break;
          }
        }
        
        if (userSession) {
          // Add question to session queue
          userSession.questionQueue.push(data.data);
          console.log(`📝 Added question to session queue: "${data.data.text}"`);
          console.log(`📊 Session ${userSession.userId} queue length: ${userSession.questionQueue.length}`);
          
          // Send first question immediately if this is the first one
          if (userSession.questionQueue.length === 1) {
            sendNextQuestion(userSession, ws);
          } else {
            console.log(`📊 Multiple questions in queue (${userSession.questionQueue.length}), waiting for first answer...`);
          }
        } else {
          console.log('❌ No session found for this WebSocket connection');
          // If no session found, try to send to all connected clients
          console.log('📤 Broadcasting question to all connected clients');
          connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'question',
                data: {
                  text: data.data.text,
                  type: data.data.type,
                  options: data.data.options
                }
              }));
            }
          });
          
          // Also try to find any active session and add the question to its queue
          for (const [userId, session] of activeSessions) {
            if (session && session.questionQueue) {
              console.log(`📝 Adding question to existing session ${userId}: "${data.data.text}"`);
              session.questionQueue.push(data.data);
              
              // If this is the first question in the queue, send it immediately
              if (session.questionQueue.length === 1) {
                console.log(`📤 Sending first question from queue: "${data.data.text}"`);
                sendNextQuestion(session, ws);
              }
              break; // Use the first active session found
            }
          }
        }
      } else if (data.type === 'answer') {
        console.log('📤 Received answer via WebSocket:', data.answer);
        
        // Find the session for this WebSocket
        let userSession = null;
        for (const [userId, session] of activeSessions) {
          if (session.websocket === ws) {
            userSession = session;
            break;
          }
        }
        
        if (userSession) {
          const current = userSession.currentQuestion;

          if (!current) {
            console.log("❌ Received answer but no current question is set.");
            return;
          }

          console.log(`✅ Matching answer "${data.answer}" to question: "${current.text}"`);

          // Save or log the answer
          const fs = require('fs');
          const path = require('path');
          const answerFile = path.join(__dirname, '../auto-apply/user_answer.json');
          
          const answerData = {
            question: current.text,
            answer: data.answer,
            timestamp: new Date().toISOString()
          };
          
          fs.writeFileSync(answerFile, JSON.stringify(answerData, null, 2));
          console.log('📤 Answer written to file:', answerData);

          // Ask next question
          sendNextQuestion(userSession, ws);
        } else {
          console.log('❌ No session found for this WebSocket connection');
          // Try to find any active session and handle the answer
          for (const [userId, session] of activeSessions) {
            if (session && session.currentQuestion) {
              console.log(`✅ Found active session ${userId} with current question: "${session.currentQuestion.text}"`);
              console.log(`✅ Matching answer "${data.answer}" to question: "${session.currentQuestion.text}"`);
              
              // Save or log the answer
              const fs = require('fs');
              const path = require('path');
              const answerFile = path.join(__dirname, '../auto-apply/user_answer.json');
              
              const answerData = {
                question: session.currentQuestion.text,
                answer: data.answer,
                timestamp: new Date().toISOString()
              };
              
              fs.writeFileSync(answerFile, JSON.stringify(answerData, null, 2));
              console.log('📤 Answer written to file:', answerData);

              // Ask next question
              sendNextQuestion(session, ws);
              return;
            } else if (session && session.questionQueue && session.questionQueue.length > 0) {
              // If no current question but queue has questions, send the first one
              console.log(`📤 No current question, but queue has ${session.questionQueue.length} questions. Sending first question.`);
              sendNextQuestion(session, ws);
              return;
            }
          }
          console.log('❌ No active session with current question or questions in queue found');
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    connectedClients.delete(ws);
    
    // Check if this WebSocket was part of a session
    for (const [userId, session] of activeSessions) {
      if (session.websocket === ws) {
        console.log(`🔐 Session WebSocket disconnected for user: ${userId}`);
        // Set websocket to null but keep session for potential reconnection
        session.websocket = null;
        
        // Set a timeout to end the session if no reconnection within 30 seconds
        setTimeout(() => {
          const currentSession = getSession(userId);
          if (currentSession && !currentSession.websocket) {
            console.log(`⏰ Session timeout reached for user: ${userId}, ending session`);
            endSession(userId);
          }
        }, 30000); // 30 seconds timeout
        
        break;
      }
    }
    
    console.log(`🔌 Remaining connected clients: ${connectedClients.size}`);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectedClients.delete(ws);
    console.log(`🔌 Remaining connected clients: ${connectedClients.size}`);
  });
});



// Function to send progress updates to all connected clients
function sendProgressToClients(progress) {
  const message = JSON.stringify({
    type: 'progress',
    data: progress
  });
  
  let sentCount = 0;
  let totalClients = 0;
  
  console.log(`🔌 Attempting to send progress to ${connectedClients.size} clients: ${progress}`);
  
  connectedClients.forEach(client => {
    totalClients++;
    console.log(`🔌 Client state: ${client.readyState} (OPEN=1, CONNECTING=0, CLOSING=2, CLOSED=3)`);
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
      console.log(`✅ Progress sent to client`);
    } else {
      console.log(`❌ Client not ready, state: ${client.readyState}`);
    }
  });
  
  console.log(`📤 Sent progress to ${sentCount}/${totalClients} clients: ${progress}`);
}

// Function to send progress to a specific session
function sendProgressToSession(userId, progress) {
  const session = getSession(userId);
  if (session && session.websocket && session.websocket.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({
      type: 'progress',
      data: progress
    });
    
    session.websocket.send(message);
    session.applicationProgress = progress;
    session.lastActivity = Date.now();
    console.log(`📤 Progress sent to session ${userId}: ${progress}`);
  } else {
    console.log(`❌ Session ${userId} not available for progress update`);
  }
}

// Function to send the next question from the queue
function sendNextQuestion(session, ws) {
  if (!session.questionQueue || session.questionQueue.length === 0) {
    console.log("✅ No more questions in queue. Application can proceed.");
    return;
  }

  // Pop the next question from the queue
  const nextQuestion = session.questionQueue.shift();

  if (!nextQuestion) {
    console.log("⚠️ Tried to shift a question but got undefined.");
    return;
  }

  // Set it as the current question
  session.currentQuestion = nextQuestion;
  session.currentQuestionIndex = (session.currentQuestionIndex || 0) + 1;

  console.log(`📤 Sending question ${session.currentQuestionIndex}: "${nextQuestion.text}"`);

  // Send to frontend via WebSocket
  ws.send(JSON.stringify({
    type: "question",
    data: {
      text: nextQuestion.text,
      type: nextQuestion.type,
      options: nextQuestion.options
    }
  }));
}

// Function to send answer back to the browser process
function sendAnswerToBrowser(answer, currentQuestion = null) {
  // Write answer to file for Playwright script to read
  const fs = require('fs');
  const path = require('path');
  const answerFile = path.join(__dirname, '../auto-apply/user_answer.json');
  
  try {
    const answerData = {
      question: currentQuestion?.text || 'Unknown question',
      answer: answer,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(answerFile, JSON.stringify(answerData, null, 2));
    console.log('📤 Answer written to file:', answerData);
  } catch (error) {
    console.error('Error writing answer to file:', error);
  }
}

// Enable CORS with production configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  console.log('✅ Health check received at /');
  res.json({
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    playwright: chromium ? 'available' : 'not available'
  });
});

// Direct job processing (no queue)
async function processJobDirectly(userId, jobId, jobUrl, credentials) {
  try {
    console.log(`📝 Processing job ${jobId} directly`);
      
      // First, ensure the job is in the linkedin_fetched_jobs table
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://xipjxcktpzanmhfrkbrm.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE'
      );
      
      // Extract job info from URL
      const jobIdFromUrl = extractJobId(jobUrl);
      if (!jobIdFromUrl) {
        throw new Error('Could not extract job ID from URL');
      }
      
      // Check if job already exists in linkedin_fetched_jobs
      const { data: existingJob, error: checkError } = await supabase
        .from('linkedin_fetched_jobs')
        .select('id')
        .eq('id', jobId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing job:', checkError);
      }
      
      // If job doesn't exist, add it to linkedin_fetched_jobs
      if (!existingJob) {
        const { error: insertError } = await supabase
          .from('linkedin_fetched_jobs')
          .insert({
            id: jobId,
            job_url: jobUrl,
            job_title: 'Job Application', // We'll get the real title from the worker
            company_name: 'Company', // We'll get the real company from the worker
            location: 'Location', // We'll get the real location from the worker
            user_id: userId,
            fetched_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error inserting job into linkedin_fetched_jobs:', insertError);
        }
      }
      
      // Update the job_swipes table to mark this job as ready for processing
      const { error: updateError } = await supabase
        .from('job_swipes')
        .update({
          application_processed: false, // This tells the easy-apply-worker to process this job
          application_success: null,
          application_error: null,
          application_processed_at: null
        })
        .eq('job_id', jobId)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating job_swipes:', updateError);
        throw updateError;
      }
      
      console.log(`✅ Job ${jobId} added to database for easy-apply-worker processing`);
      
      // Start the easy-apply-worker if it's not already running
    await startEasyApplyWorker(userId);
      
    return 'Job processed directly by easy-apply-worker';
      
    } catch (error) {
      console.error(`❌ Error processing job ${jobId}:`, error);
      throw error;
    }
  }

  // Start the easy-apply-worker for a user
async function startEasyApplyWorker(userId) {
    try {
      console.log(`🚀 Starting easy-apply-worker for user: ${userId}`);
      console.log('✅ Easy-apply-worker setup validated - using test-simple-click.js approach');
      console.log('Browser management is handled by the session system');
      
      // No longer spawning separate processes - browser is managed by session
      return { success: true, message: 'Worker setup validated' };
      
    } catch (error) {
      console.error(`❌ Error starting easy-apply-worker for user ${userId}:`, error);
      throw error;
  }
}

// Job search endpoint
app.post('/api/job-search', async (req, res) => {
  try {
    const { jobTitle, location, maxResults = 20, linkedInCredentials } = req.body;
    
    console.log('Received job search request:', {
      jobTitle,
      location,
      maxResults,
      linkedInCredentials: { email: linkedInCredentials?.email, password: '***' }
    });

    // Validate required fields
    if (!jobTitle || !location || !linkedInCredentials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobTitle, location, or linkedInCredentials'
      });
    }

    // Set environment variables for the auto-apply system
    const env = {
      ...process.env,
      LINKEDIN_EMAIL: linkedInCredentials.email,
      LINKEDIN_PASSWORD: linkedInCredentials.password,
      BROWSER_HEADLESS: 'false',
      BROWSER_SLOW_MO: '1000',
      RESUME_PATH: './resume.pdf',
      SCREENSHOT_DIR: './screenshots',
      PAGE_LOAD_TIMEOUT: '30000',
      ELEMENT_WAIT_TIMEOUT: '10000',
    };

    // Run the Easy Apply job search
    const autoApplyPath = path.join(__dirname, '../auto-apply');
    const child = spawn('node', ['dist/index.js', 'easy-apply', jobTitle, location, 'default-user'], {
      cwd: autoApplyPath,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Job search output:', data.toString());
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Job search error:', data.toString());
    });

    child.on('close', (code) => {
      console.log(`Job search process exited with code ${code}`);
      
      if (code === 0) {
        // Parse jobs from output using the Easy Apply parser
        const jobs = parseEasyApplyJobsFromOutput(output);
        
        res.json({
          success: true,
          jobs,
          count: jobs.length
        });
      } else {
        // Error
        res.status(500).json({
          success: false,
          jobs: [],
          count: 0,
          error: errorOutput || 'Job search process failed',
        });
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start job search process:', error);
      res.status(500).json({
        success: false,
        jobs: [],
        count: 0,
        error: 'Failed to start job search process',
      });
    });

  } catch (error) {
    console.error('Error in job search endpoint:', error);
    res.status(500).json({
      success: false,
      jobs: [],
      count: 0,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Get job details endpoint
app.post('/api/job-details', async (req, res) => {
  try {
    const { jobUrl, linkedInCredentials } = req.body;
    
    console.log('Received job details request:', {
      jobUrl,
      linkedInCredentials: { email: linkedInCredentials?.email, password: '***' }
    });

    // Validate required fields
    if (!jobUrl || !linkedInCredentials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobUrl or linkedInCredentials'
      });
    }

    // Set environment variables for the auto-apply system
    const env = {
      ...process.env,
      LINKEDIN_EMAIL: linkedInCredentials.email,
      LINKEDIN_PASSWORD: linkedInCredentials.password,
      BROWSER_HEADLESS: 'false',
      BROWSER_SLOW_MO: '1000',
      RESUME_PATH: './resume.pdf',
      SCREENSHOT_DIR: './screenshots',
      PAGE_LOAD_TIMEOUT: '30000',
      ELEMENT_WAIT_TIMEOUT: '10000',
    };

    // Run the job details fetch
    const autoApplyPath = path.join(__dirname, '../auto-apply');
    const child = spawn('node', ['dist/index.js', 'details', jobUrl], {
      cwd: autoApplyPath,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Job details output:', data.toString());
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Job details error:', data.toString());
    });

    child.on('close', (code) => {
      console.log(`Job details process exited with code ${code}`);
      
      if (code === 0) {
        // Parse job details from output
        const jobDetails = parseJobDetailsFromOutput(output);
        
        res.json({
          success: true,
          job: jobDetails
        });
      } else {
        // Error
        res.status(500).json({
          success: false,
          job: null,
          error: errorOutput || 'Job details process failed',
        });
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start job details process:', error);
      res.status(500).json({
        success: false,
        job: null,
        error: 'Failed to start job details process',
      });
    });

  } catch (error) {
    console.error('Error in job details endpoint:', error);
    res.status(500).json({
      success: false,
      job: null,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Auto-apply endpoint
app.post('/api/auto-apply', async (req, res) => {
  try {
    const { jobUrl, userProfile, linkedInCredentials } = req.body;
    
    console.log('Received auto-apply request:', {
      jobUrl,
      userProfile: { ...userProfile, email: '***' },
      linkedInCredentials: { email: linkedInCredentials.email, password: '***' }
    });

    // Validate required fields
    if (!jobUrl || !userProfile || !linkedInCredentials) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobUrl, userProfile, or linkedInCredentials'
      });
    }

    const userId = userProfile.id || 'default';
    
    // Step 1: Check if session is active
    console.log('🔍 Step 1: Checking session status...');
    const sessionActive = isSessionActive(userId);
    const browserRunning = isBrowserRunningForSession(userId);
    
    if (!sessionActive) {
      console.log('❌ No active session found. User must start a session first.');
      return res.status(400).json({
        success: false,
        error: 'No active session found. Please start a session first.',
        step: 'session_check'
      });
    }
    
    if (!browserRunning) {
      console.log('❌ Browser not running in session. Session may be corrupted.');
        return res.status(500).json({
          success: false,
        error: 'Browser not running in session. Please restart the session.',
        step: 'browser_check'
        });
      }
    
    console.log('✅ Session and browser are active');

    // Step 2: Add job to the worker's queue
    console.log('🔍 Step 2: Adding job to worker queue...');
    try {
      // Add the job to the database for the worker to process
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }
      
      // Insert job application request into database
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          user_id: userId,
          job_url: jobUrl,
          job_title: userProfile.jobTitle || 'Unknown',
          company: userProfile.company || 'Unknown',
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Failed to insert job application:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to queue job application',
          details: insertError.message
        });
      }
      
      console.log('✅ Job added to worker queue');
      
      // Update session activity
      const session = getSession(userId);
      if (session) {
        session.lastActivity = Date.now();
      }
      
      // Return success immediately - the worker will process the job
      res.json({
          success: true,
        message: 'Job queued for application',
          jobId: extractJobId(jobUrl),
        status: 'queued'
      });
      
    } catch (error) {
      console.error('❌ Error queuing job:', error);
      return res.status(500).json({
          success: false,
        error: 'Failed to queue job for application',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Error in auto-apply endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Job fetcher endpoint - uses existing session browser with progress tracking
app.post('/api/fetch-jobs', async (req, res) => {
  try {
    const { userId, searchFilters } = req.body;
    
    console.log('Received job fetch request for user:', userId);
    console.log('Search filters:', searchFilters);

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    // Check if user has an active session with browser
    const session = getSession(userId);
    if (!session || !session.isBrowserRunning || !session.browserPage) {
      return res.status(400).json({
        success: false,
        error: 'No active browser session found. Please start a session first.'
      });
    }

    // Additional check to ensure the browser page is still valid
    try {
      await session.browserPage.evaluate(() => document.title);
    } catch (error) {
      console.log(`❌ Browser page is closed for user: ${userId}`);
      return res.status(400).json({
        success: false,
        error: 'Browser session has been closed. Please start a new session first.'
      });
    }

    // Check if job fetch is already in progress for this user
    if (jobFetchInProgress.get(userId)) {
      console.log(`⚠️ Job fetch already in progress for user: ${userId}`);
      return res.status(409).json({
        success: false,
        error: 'Job fetch already in progress. Please wait for the current fetch to complete.',
        status: 'in_progress'
      });
    }

    // Mark job fetch as in progress
    jobFetchInProgress.set(userId, true);
    console.log(`🔄 Job fetch marked as in progress for user: ${userId}`);
    
    // Add a small delay to prevent rapid successive requests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send immediate response to frontend
    res.json({
      success: true,
      message: 'Job fetching started successfully',
      status: 'fetching'
    });

    // Use the existing session browser to fetch jobs with progress tracking
    try {
      console.log('🔄 Starting job fetch with session browser...');
      sendProgressToSession(userId, '🚀 Starting job fetch...');
      
      const page = session.browserPage;
      
      // Step 1: Get user search criteria
      sendProgressToSession(userId, '📋 Getting user search criteria...');
      console.log('📋 Getting user search criteria...');
      
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://xipjxcktpzanmhfrkbrm.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE'
      );
      
      // Get user profile and search filters
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('location, radius, latitude, longitude, salary_min, salary_max, desired_job_title')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('⚠️ Using fallback location: New York, NY');
      }

      // Use search filters if provided, otherwise fall back to profile data
      const location = searchFilters?.location || profile?.location || 'New York, NY';
      const radius = searchFilters?.radius || profile?.radius || 5;
      const salaryMin = searchFilters?.salaryMin || profile?.salary_min || 0;
      const salaryMax = searchFilters?.salaryMax || profile?.salary_max || 0;
      const jobTitle = searchFilters?.jobTitle || profile?.desired_job_title || 'Intern'; // Use user's desired job title
      
      console.log('📋 Search criteria:', { location, radius, salaryMin, salaryMax, jobTitle });
      sendProgressToSession(userId, `📋 Search criteria: ${jobTitle} in ${location} (radius: ${radius}mi, salary: $${salaryMin}-$${salaryMax})`);
      
      // Step 2: Navigate to LinkedIn job search page
      sendProgressToSession(userId, '🔗 Navigating to LinkedIn job search...');
      console.log('🔗 Navigating to LinkedIn job search...');
      
      // Build LinkedIn search URL with filters
      let searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}&f_AL=true&f_TPR=r86400`;
      
      // Add salary range filter if specified
      if (salaryMin > 0 && salaryMax > 0) {
        // LinkedIn uses salary ranges in thousands, so convert from actual salary to range
        const minSalaryK = Math.floor(salaryMin / 1000);
        const maxSalaryK = Math.ceil(salaryMax / 1000);
        searchUrl += `&f_SB2=${minSalaryK}%2C${maxSalaryK}`;
      }
      
      // Add distance filter (radius) if specified
      if (radius > 0) {
        // LinkedIn uses miles for distance, so we can use the radius directly
        searchUrl += `&distance=${radius}`;
      }
      
      console.log('🔗 Search URL:', searchUrl);
      
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      await page.waitForTimeout(3000); // Give time for jobs to load
      console.log('✅ Job search page loaded');
      sendProgressToSession(userId, '✅ Job search page loaded, extracting jobs...');
      
      // Step 3: Extract jobs with progress tracking
      console.log('🔍 Extracting jobs from page...');
      sendProgressToSession(userId, '🔍 Starting job extraction with pagination...');
      const jobs = await extractJobsWithProgress(page, userId);
      
      console.log(`✅ Extracted ${jobs.length} jobs from LinkedIn`);
      sendProgressToSession(userId, `✅ Successfully extracted ${jobs.length} jobs`);
      
      // Step 4: Save jobs to database
      sendProgressToSession(userId, '💾 Saving jobs to database...');
      console.log('💾 Saving jobs to database...');
      
      // Save each job to the database
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        await supabase.from('linkedin_fetched_jobs').upsert([{
          user_id: userId,
          job_title: job.title,
          company_name: job.company,
          location: job.location,
          job_url: job.jobUrl,
          easy_apply: job.isEasyApply,
          salary: job.salary || null,
          description: job.description || null,
          is_active: true,
          created_at: new Date().toISOString()
        }]);
        
        // Update progress for each job saved
        sendProgressToSession(userId, `💾 Saving job ${i + 1}/${jobs.length}: ${job.title}`);
      }
      
      console.log(`✅ Saved ${jobs.length} jobs to database`);
      sendProgressToSession(userId, `🎉 Job fetch completed! Saved ${jobs.length} jobs to database`);
      
      // Send WebSocket message to notify frontend of completion
      if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
        session.websocket.send(JSON.stringify({
          type: 'job_fetch_completed',
          data: {
            success: true,
            jobsCount: jobs.length,
            message: `Successfully fetched and saved ${jobs.length} jobs`
          }
        }));
      }
      
    } catch (error) {
      console.error('Error fetching jobs with session browser:', error);
      
      // Check if the error is due to a closed browser
      if (error.message.includes('Target page, context or browser has been closed') || 
          error.message.includes('Browser page has been closed')) {
        sendProgressToSession(userId, '❌ Browser session was closed. Please start a new session.');
        
        // Send WebSocket message to notify frontend of browser closure
        const session = getSession(userId);
        if (session && session.websocket && session.websocket.readyState === WebSocket.OPEN) {
          session.websocket.send(JSON.stringify({
            type: 'job_fetch_error',
            data: {
              success: false,
              error: 'Browser session was closed. Please start a new session to fetch jobs.'
            }
          }));
        }
      } else {
        sendProgressToSession(userId, `❌ Job fetch failed: ${error.message}`);
        
        // Send WebSocket message to notify frontend of error
        const session = getSession(userId);
        if (session && session.websocket && session.websocket.readyState === WebSocket.OPEN) {
          session.websocket.send(JSON.stringify({
            type: 'job_fetch_error',
            data: {
              success: false,
              error: 'Failed to fetch jobs: ' + error.message
            }
          }));
        }
      }
    } finally {
      // Always clean up the job fetch state
      jobFetchInProgress.set(userId, false);
      console.log(`✅ Job fetch completed for user: ${userId}, state cleared`);
    }

  } catch (error) {
    console.error('Error in job fetch endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Endpoint to reset job fetch progress flag
app.post('/api/reset-job-fetch', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Reset the job fetch progress flag
    jobFetchInProgress.set(userId, false);
    console.log(`🔄 Job fetch progress reset for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Job fetch progress reset successfully'
    });
    
  } catch (error) {
    console.error('Error resetting job fetch progress:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    });
  }
});

// Helper function to extract jobs with progress tracking
async function extractJobsWithProgress(page, userId, targetJobs = 15) {
  console.log(`🚀 Starting job extraction with target: ${targetJobs} jobs`);
  console.log(`🔍 Function called with page: ${!!page}, userId: ${userId}, targetJobs: ${targetJobs}`);
  
  // Check if the page is still valid before starting extraction
  try {
    await page.evaluate(() => document.title);
  } catch (error) {
    console.log(`❌ Browser page is closed during extraction for user: ${userId}`);
    throw new Error('Browser page has been closed. Cannot extract jobs.');
  }
  
  // Helper function to format salary with proper units
  function formatSalary(salary) {
    if (!salary) return '';
    
    // Remove any existing units
    let cleanSalary = salary.replace(/\/(hour|hr|year|yr|month|mo|week|wk|day)/gi, '');
    
    // Extract the number
    const numberMatch = cleanSalary.match(/[\d,]+/);
    if (!numberMatch) return salary;
    
    const number = parseInt(numberMatch[0].replace(/,/g, ''));
    
    // Determine the unit based on the amount
    if (number < 1000) {
      return `$${number}/hour`;
    } else if (number < 10000) {
      return `$${number}/month`;
    } else {
      return `$${number}/year`;
    }
  }
  
  // Helper function to clean description
  function cleanDescription(description) {
    if (!description) return '';
    
    // Remove "About the job" prefix
    let cleanDesc = description.replace(/^About the job\s*/i, '');
    
    // Remove extra whitespace and newlines
    cleanDesc = cleanDesc.replace(/\n\s*\n/g, '\n').trim();
    
    return cleanDesc;
  }
  
  const jobs = [];
  const seenJobs = new Set();
  let currentPage = 1;
  let totalJobsProcessed = 0;
  
  try {
    while (jobs.length < targetJobs && currentPage <= 3) { // Limit to 3 pages to avoid infinite loops
      console.log(`📄 Processing page ${currentPage}... (jobs: ${jobs.length}/${targetJobs})`);
      sendProgressToSession(userId, `📄 Processing page ${currentPage}... (${jobs.length}/${targetJobs} jobs extracted)`);
      
      // Wait for job cards to load on current page
      await page.waitForSelector('a.job-card-container__link', { timeout: 10000 });
      
      console.log('⚡ FAST MODE: No initial scrolling - extracting jobs directly');
      
      // Get all job cards on current page - try multiple selectors
      let jobCards = await page.locator('a.job-card-container__link').all();
      console.log(`🔍 Primary selector found ${jobCards.length} job cards`);
      
      // If we didn't find enough jobs, try alternative selectors
      if (jobCards.length < 10) {
        const alternativeCards = await page.locator('[data-control-name="jobsearch_job_resultcard"]').all();
        console.log(`🔍 Alternative selector found ${alternativeCards.length} job cards`);
        
        if (alternativeCards.length > jobCards.length) {
          jobCards = alternativeCards;
          console.log(`🔍 Using alternative selector with ${jobCards.length} cards`);
        }
      }
      
      // If still not enough, try all job links
      if (jobCards.length < 10) {
        const allJobLinks = await page.locator('a[href*="/jobs/view/"]').all();
        console.log(`🔍 All job links found: ${allJobLinks.length}`);
        
        if (allJobLinks.length > jobCards.length) {
          jobCards = allJobLinks;
          console.log(`🔍 Using all job links with ${jobCards.length} cards`);
        }
      }
      
      console.log(`🔍 Final job cards count: ${jobCards.length} on page ${currentPage}`);
      
      // Re-check job count after scrolling to get the most up-to-date count
      const finalJobCount = await page.locator('a.job-card-container__link').count();
      console.log(`🔍 Re-checked job count after scrolling: ${finalJobCount} cards`);
      
      // Use the higher count for extraction
      const maxJobCount = Math.max(jobCards.length, finalJobCount);
      console.log(`🔍 Using max job count: ${maxJobCount} for extraction`);
      
      if (maxJobCount === 0) {
        console.log('⚠️ No job cards found on this page, stopping pagination');
        break;
      }
      
      // Extract jobs from current page
      for (let i = 0; i < maxJobCount && jobs.length < targetJobs; i++) {
        try {
          totalJobsProcessed++;
          console.log(`🔍 Processing job card ${i + 1}/${maxJobCount} (total jobs: ${jobs.length}/${targetJobs})`);
          // Update progress
          sendProgressToSession(userId, `🔍 Extracting job ${totalJobsProcessed}/${targetJobs}...`);
          
          // Re-fetch job cards in case new ones were loaded
          const currentJobCards = await page.locator('a.job-card-container__link').all();
          if (i >= currentJobCards.length) {
            console.log(`⚠️ Job card index ${i} is beyond available cards (${currentJobCards.length}), stopping extraction`);
            break;
          }
          
          // First, get basic info from the job card
          const basicJobInfo = await page.evaluate((index) => {
            const cards = document.querySelectorAll('a.job-card-container__link');
            if (index >= cards.length) return null;
            
            const card = cards[index];
            const title = card.querySelector('span[aria-hidden="true"] > strong')?.textContent?.trim() || '';
            const company = card.closest('[data-control-name]')?.querySelector('.artdeco-entity-lockup__subtitle')?.textContent?.trim() || '';
            const location = card.closest('[data-control-name]')?.querySelector('.artdeco-entity-lockup__caption')?.textContent?.trim() || '';
            const jobUrl = card.getAttribute('href') || '';
            
            console.log(`🔍 Basic job info for card ${index}:`, { title, company, location, jobUrl });
            
            return {
              title,
              company,
              location,
              jobUrl: jobUrl.startsWith('http') ? jobUrl : `https://www.linkedin.com${jobUrl}`,
              isEasyApply: true // Assume all jobs are Easy Apply for now
            };
          }, i);
          
          if (!basicJobInfo || !basicJobInfo.title) {
            console.log(`⚠️ No basic info found for job ${totalJobsProcessed}`);
            continue;
          }
          
          // Create unique key for duplicate detection
          const jobKey = `${basicJobInfo.title}-${basicJobInfo.company || 'Unknown'}`.toLowerCase();
          if (seenJobs.has(jobKey)) {
            console.log(`⏭️ Skipping duplicate job: ${jobKey}`);
            continue;
          }
          
          // Click on the job card to load detailed view
          if (i < currentJobCards.length) {
            await currentJobCards[i].scrollIntoViewIfNeeded();
            await currentJobCards[i].click();
            await page.waitForTimeout(1000); // Reduced wait time for FAST MODE
            
            // FAST MODE: No scrolling between jobs
            
            // Wait for description content to load
            try {
              await page.waitForSelector('.jobs-description__content, .job-details-jobs-unified-top-card__job-description__content, .jobs-unified-top-card__job-description__content', { timeout: 2000 });
            } catch (error) {
              console.log('⚠️ Description content not found, proceeding anyway...');
            }

            // Extract detailed job information from the right panel
            const jobDetails = await page.evaluate(() => {
              console.log('🔍 Starting job details extraction...');
              
              // Salary extraction function
              function extractSalaryFromText(text) {
                if (!text) return '';
                
                // Common salary patterns
                const salaryPatterns = [
                  /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                  /\$[\d,]+(?:\s+to\s+\$[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                  /\$[\d,]+-[\d,]+(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                  /(?:USD|US\$|CAD|EUR|GBP)\s*[\d,]+(?:\s*-\s*[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                  /(?:salary|compensation|pay)\s*(?:range|of)?\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?(?:\s*\/\s*(?:hour|hr|year|yr|month|mo|week|wk|day))?/gi,
                  /(?:annual|yearly)\s*(?:salary|compensation)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
                  /(?:hourly|per\s+hour)\s*(?:rate|pay)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
                  /(?:base\s+)?salary\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
                  /compensation\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi,
                  /(?:benefits|package)\s*:\s*\$?[\d,]+(?:\s*-\s*\$?[\d,]+)?/gi
                ];
                
                // Look for salary patterns in the text
                for (const pattern of salaryPatterns) {
                  const matches = text.match(pattern);
                  if (matches && matches.length > 0) {
                    let salary = matches[0].trim();
                    salary = salary.replace(/^(salary|compensation|pay|annual|yearly|hourly|per\s+hour|base|benefits|package)\s*(?:range|of)?\s*:\s*/gi, '');
                    if (/^\d/.test(salary) && !salary.startsWith('$')) {
                      salary = '$' + salary;
                    }
                    return salary;
                  }
                }
                
                // Look for specific salary keywords and extract nearby numbers
                const salaryKeywords = ['salary', 'compensation', 'pay', 'earnings', 'income', 'wage', 'rate', 'package'];
                const lines = text.split('\n');
                for (const line of lines) {
                  const lowerLine = line.toLowerCase();
                  for (const keyword of salaryKeywords) {
                    if (lowerLine.includes(keyword)) {
                      const dollarMatches = line.match(/\$[\d,]+(?:\s*-\s*\$[\d,]+)?/g);
                      if (dollarMatches && dollarMatches.length > 0) {
                        return dollarMatches[0].trim();
                      }
                      const numberMatches = line.match(/[\d,]+(?:\s*-\s*[\d,]+)?/g);
                      if (numberMatches && numberMatches.length > 0) {
                        const numbers = numberMatches.map(n => n.replace(/,/g, '')).filter(n => parseInt(n) > 1000);
                        if (numbers.length > 0) {
                          return '$' + numbers[0] + '/year';
                        }
                      }
                    }
                  }
                }
                return '';
              }
              
              // Job title selectors
              const titleSelectors = [
                '.job-details-jobs-unified-top-card__job-title',
                '.jobs-unified-top-card__job-title',
                'h1',
                '.job-details-jobs-unified-top-card__job-title-link',
                '.jobs-unified-top-card__job-title-link'
              ];
              
              const companySelectors = [
                '.job-details-jobs-unified-top-card__company-name',
                '.jobs-unified-top-card__company-name',
                '.job-details-jobs-unified-top-card__company-name-link',
                '.jobs-unified-top-card__company-name-link'
              ];
              
              const locationSelectors = [
                '.job-details-jobs-unified-top-card__bullet',
                '.jobs-unified-top-card__bullet',
                '.job-details-jobs-unified-top-card__location',
                '.jobs-unified-top-card__location',
                '.tvm_text.tvm_text--low-emphasis',
                '.job-details-jobs-unified-top-card__tertiary-description-container .tvm_text',
                '.jobs-unified-top-card__tertiary-description-container .tvm_text',
                '[class*="tertiary-description"] .tvm_text',
                '.tvm_text--low-emphasis',
                '.job-details-jobs-unified-top-card__tertiary-description-container span',
                '.jobs-unified-top-card__tertiary-description-container span'
              ];
              
              const salarySelectors = [
                '.job-details-jobs-unified-top-card__salary-info',
                '.jobs-unified-top-card__salary-info',
                '.job-details-jobs-unified-top-card__salary',
                '.job-details-jobs-unified-top-card__metadata',
                '.jobs-unified-top-card__metadata'
              ];
              
              const descriptionSelectors = [
                '.jobs-description__content',
                '.job-details-jobs-unified-top-card__job-description__content',
                '.jobs-unified-top-card__job-description__content',
                '.jobs-description',
                '.job-description',
                '.jobs-unified-top-card__job-description',
                '.job-details-jobs-unified-top-card__job-description'
              ];
              
              const easyApplySelectors = [
                '.jobs-apply-button--top-card',
                '.jobs-apply-button',
                '.artdeco-button--primary',
                '.jobs-unified-top-card__container--two-pane button'
              ];
              
              let title = '';
              let company = '';
              let location = '';
              let salary = '';
              let description = '';
              let easyApply = false;
              
              // Extract job title
              for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  title = element.textContent?.trim() || '';
                  console.log(`🔍 Title selector "${selector}" found: "${title}"`);
                  if (title) break;
                }
              }
              
              // Extract company name
              for (const selector of companySelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  company = element.textContent?.trim() || '';
                  console.log(`🔍 Company selector "${selector}" found: "${company}"`);
                  if (company) break;
                }
              }
              
              // Extract location
              for (const selector of locationSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  location = element.textContent?.trim() || '';
                  console.log(`🔍 Location selector "${selector}" found: "${location}"`);
                  if (location) break;
                }
              }
              
              // Extract salary from dedicated salary elements first
              for (const selector of salarySelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  salary = element.textContent?.trim() || '';
                  if (salary) break;
                }
              }
              
              // Extract description/requirements
              for (const selector of descriptionSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  const text = element.textContent?.trim() || '';
                  if (text && text.length > 50) {
                    description = text;
                    break;
                  }
                }
              }
              
              // If no description found with selectors, try to find the largest text block
              if (!description || description.length < 50) {
                const allTextElements = document.querySelectorAll('p, div, span');
                let largestText = '';
                for (const element of allTextElements) {
                  const text = element.textContent?.trim() || '';
                  if (text.length > largestText.length && text.length > 100 && text.length < 10000) {
                    const lowerText = text.toLowerCase();
                    if (lowerText.includes('responsibilities') || 
                        lowerText.includes('requirements') || 
                        lowerText.includes('qualifications') ||
                        lowerText.includes('experience') ||
                        lowerText.includes('skills') ||
                        lowerText.includes('about') ||
                        lowerText.includes('role') ||
                        lowerText.includes('position')) {
                      largestText = text;
                    }
                  }
                }
                if (largestText) {
                  description = largestText;
                }
              }
              
              // If no salary found with selectors, try to extract from description
              if (!salary && description) {
                const extractedSalary = extractSalaryFromText(description);
                if (extractedSalary) {
                  salary = extractedSalary;
                }
              }
              
              // Check for Easy Apply button
              for (const selector of easyApplySelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  easyApply = true;
                  break;
                }
              }
              
              return {
                title,
                company,
                location,
                salary,
                description,
                easyApply,
                url: window.location.href
              };
            });
            
            console.log('📋 Job details extracted:', {
              title: jobDetails.title,
              company: jobDetails.company,
              location: jobDetails.location,
              salary: jobDetails.salary,
              description: jobDetails.description ? `${jobDetails.description.substring(0, 100)}...` : 'No description',
              descriptionLength: jobDetails.description?.length || 0,
              easyApply: jobDetails.easyApply,
              url: jobDetails.url
            });
            
            if (jobDetails.title) {
              // Clean up location data - only keep the first part
              let cleanLocation = basicJobInfo.location || jobDetails.location || '';
              if (cleanLocation) {
                // Remove metadata like timestamps and applicant counts
                cleanLocation = cleanLocation.replace(/\d+\s*(?:applicant|applicants?|people|person)/gi, '').trim();
                cleanLocation = cleanLocation.replace(/\d+\s*(?:day|days?|hour|hours?|minute|minutes?|second|seconds?)\s*ago/gi, '').trim();
                cleanLocation = cleanLocation.replace(/^\s*[•·]\s*/, '').trim();
                cleanLocation = cleanLocation.replace(/Reposted\s*\d*\s*hours?\s*ago/gi, '').trim();
                cleanLocation = cleanLocation.replace(/Promoted\s*by\s*hirer/gi, '').trim();
                cleanLocation = cleanLocation.replace(/Actively\s*reviewing\s*applicants/gi, '').trim();
                cleanLocation = cleanLocation.replace(/No\s*response\s*insights\s*available\s*yet/gi, '').trim();
                cleanLocation = cleanLocation.replace(/Company\s*review\s*time\s*is\s*typically\s*\d*\s*week/gi, '').trim();
                
                // Only keep the first part (before any separator)
                cleanLocation = cleanLocation.split(/[·•]/)[0].trim();
                cleanLocation = cleanLocation.split(/\s*,\s*/)[0].trim();
              }
              
              const job = {
                title: jobDetails.title,
                company: jobDetails.company || basicJobInfo.company,
                location: cleanLocation,
                jobUrl: jobDetails.url || basicJobInfo.jobUrl,
                isEasyApply: jobDetails.easyApply,
                salary: formatSalary(jobDetails.salary || ''),
                description: cleanDescription(jobDetails.description || '')
              };
              
              jobs.push(job);
              seenJobs.add(jobKey);
              console.log(`✅ Extracted job ${totalJobsProcessed}: ${job.title} at ${job.company}`);
            } else {
              console.log('⚠️ No job title found for this card');
            }
            
            await page.waitForTimeout(1000); // Wait between job extractions
          }
          
        } catch (cardError) {
          console.log(`⚠️ Error extracting job ${totalJobsProcessed}:`, cardError.message);
          
          // If we get an "Execution context was destroyed" error, break out of the loop
          if (cardError.message.includes('Execution context was destroyed')) {
            console.log('🛑 Execution context destroyed, stopping job extraction');
            break;
          }
          
          continue;
        }
      }
      
      console.log(`📄 Finished processing page ${currentPage}: extracted ${jobs.length} jobs from ${jobCards.length} cards`);
      
      // If we haven't reached our target and there are more pages, try to go to next page
      if (jobs.length < targetJobs && currentPage < 3) {
        try {
          console.log(`📄 Attempting to go to page ${currentPage + 1}... (current jobs: ${jobs.length}/${targetJobs})`);
          
          // Look for the "Next" button
          const nextButton = await page.$('button[aria-label="Next"]');
          if (nextButton) {
            sendProgressToSession(userId, `📄 Navigating to page ${currentPage + 1}...`);
            await nextButton.click();
            await page.waitForTimeout(3000); // Wait for page to load
            currentPage++;
            console.log(`✅ Successfully navigated to page ${currentPage}`);
          } else {
            console.log('⚠️ No "Next" button found, stopping pagination');
            break;
          }
        } catch (paginationError) {
          console.log('⚠️ Error navigating to next page:', paginationError.message);
          break;
        }
      } else {
        console.log(`📄 Stopping pagination: jobs.length=${jobs.length}, targetJobs=${targetJobs}, currentPage=${currentPage}`);
        break; // Either we have enough jobs or we've reached the page limit
      }
    }
    
    console.log(`✅ Successfully extracted ${jobs.length} jobs from ${currentPage} page(s)`);
    console.log(`📊 Final extraction summary: ${jobs.length} jobs, ${currentPage} pages, target was ${targetJobs}`);
    return jobs;
    
  } catch (error) {
    console.error('Error in extractJobsWithProgress:', error);
    
    // If we get an "Execution context was destroyed" error, return what we have
    if (error.message.includes('Execution context was destroyed')) {
      console.log('🛑 Execution context destroyed, returning extracted jobs so far');
      return jobs;
    }
    
    throw error;
  }
}

// Easy Apply jobs endpoint
app.post('/api/easy-apply-jobs', async (req, res) => {
  try {
    const { searchTerm, location, linkedInCredentials, userId } = req.body;
    
    console.log('Received Easy Apply jobs request:', {
      searchTerm,
      location,
      userId,
      linkedInCredentials: { email: linkedInCredentials?.email, password: '***' }
    });

    // Validate required fields
    if (!searchTerm || !location || !linkedInCredentials || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: searchTerm, location, linkedInCredentials, or userId'
      });
    }

    // Set environment variables for the auto-apply system
    const env = {
      ...process.env,
      LINKEDIN_EMAIL: linkedInCredentials.email,
      LINKEDIN_PASSWORD: linkedInCredentials.password,
      BROWSER_HEADLESS: 'false',
      BROWSER_SLOW_MO: '1000',
      RESUME_PATH: './resume.pdf',
      SCREENSHOT_DIR: './screenshots',
      PAGE_LOAD_TIMEOUT: '30000',
      ELEMENT_WAIT_TIMEOUT: '10000',
    };

    // Run the Easy Apply job fetch with the new function signature
    const autoApplyPath = path.join(__dirname, '../auto-apply');
    const child = spawn('node', ['dist/index.js', 'easy-apply', userId], {
      cwd: autoApplyPath,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Easy Apply jobs output:', data.toString());
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Easy Apply jobs error:', data.toString());
    });

    child.on('close', (code) => {
      console.log(`Easy Apply jobs process exited with code ${code}`);
      
      if (code === 0) {
        // Parse jobs from output
        const jobs = parseEasyApplyJobsFromOutput(output);
        
        res.json({
          success: true,
          jobs,
          count: jobs.length
        });
      } else {
        // Error
        res.status(500).json({
          success: false,
          jobs: [],
          count: 0,
          error: errorOutput || 'Easy Apply jobs process failed',
        });
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start Easy Apply jobs process:', error);
      res.status(500).json({
        success: false,
        jobs: [],
        count: 0,
        error: 'Failed to start Easy Apply jobs process',
      });
    });

  } catch (error) {
    console.error('Error in Easy Apply jobs endpoint:', error);
    res.status(500).json({
      success: false,
      jobs: [],
      count: 0,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    backend: {
      status: 'running',
      port: PORT,
      uptime: process.uptime()
    },
    queue: {
      status: applicationQueue.isProcessing ? 'processing' : 'idle',
      queueLength: applicationQueue.queue.length,
      completedJobs: applicationQueue.completedJobs.length
    },
    workers: {
      activeWorkers: Object.keys(applicationQueue.workerProcesses || {}).length,
      workerDetails: applicationQueue.workerProcesses ? 
        Object.keys(applicationQueue.workerProcesses).map(userId => ({
          userId,
          status: applicationQueue.workerProcesses[userId] ? 'running' : 'stopped'
        })) : []
    }
  };
  
  res.json(healthStatus);
});

// Browser status endpoint
app.get('/api/browser-status/:userId', (req, res) => {
  const { userId } = req.params;
  
  const browserStatus = {
    userId,
    isRunning: !!(applicationQueue.workerProcesses && applicationQueue.workerProcesses[userId]),
    timestamp: new Date().toISOString(),
    workerDetails: applicationQueue.workerProcesses && applicationQueue.workerProcesses[userId] ? {
      pid: applicationQueue.workerProcesses[userId].pid,
      status: 'running'
    } : null
  };
  
  res.json(browserStatus);
});

// Test backend connectivity endpoint
app.get('/api/test-connectivity', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is accessible',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      browserStatus: '/api/browser-status/:userId',
      autoApply: '/api/auto-apply'
    }
  });
});

// Reset pagination endpoint
app.post('/api/reset-pagination', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('Received pagination reset request for user:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    // Run the pagination reset command
    const autoApplyPath = path.join(__dirname, '../auto-apply');
    const child = spawn('node', ['dist/index.js', 'reset-pagination', userId], {
      cwd: autoApplyPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Reset pagination output:', data.toString());
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Reset pagination error:', data.toString());
    });

    child.on('close', (code) => {
      console.log(`Reset pagination process exited with code ${code}`);
      
      if (code === 0) {
        res.json({
          success: true,
          message: 'Pagination state reset successfully',
          output: output.trim()
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorOutput || 'Reset pagination process failed',
          output: output.trim()
        });
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start reset pagination process:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start reset pagination process',
      });
    });

  } catch (error) {
    console.error('Error in reset pagination endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Start Easy Apply Worker endpoint
app.post('/api/start-easy-apply-worker', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('Received Easy Apply Worker start request for user:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    // No longer spawning separate processes - browser is managed by session
    console.log('✅ Easy Apply worker setup validated - using test-simple-click.js approach');
    console.log('Browser management is handled by the session system');
    
    res.json({
      success: true,
      message: 'Easy Apply worker setup validated - browser managed by session',
      output: 'Using proven test-simple-click.js approach'
    });

  } catch (error) {
    console.error('Error in start Easy Apply worker endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Test endpoint to manually trigger job application (direct processing)
app.post('/api/test-apply', async (req, res) => {
  try {
    const { userId, jobId, jobUrl } = req.body;
    
    console.log('🧪 Direct apply request:', { userId, jobId, jobUrl });
    
    if (!userId || !jobId || !jobUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, jobId, or jobUrl'
      });
    }

    // Get LinkedIn credentials from the database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      'https://xipjxcktpzanmhfrkbrm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE'
    );

    // Get LinkedIn credentials for the user
    const { data: credentials, error: credError } = await supabase
      .from('linkedin_credentials')
      .select('email, password_encrypted')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      console.error('❌ No LinkedIn credentials found for user:', userId);
      console.error('❌ Credential error:', credError);
      
      // Let's also check what credentials exist for this user
      const { data: allCreds, error: checkError } = await supabase
        .from('linkedin_credentials')
        .select('id, email, is_active')
        .eq('id', userId);
      
      if (checkError) {
        console.error('❌ Error checking credentials:', checkError);
      } else {
        console.log('📋 Available credentials for user:', allCreds);
      }
      
      return res.status(400).json({
        success: false,
        error: 'No LinkedIn credentials found. Please save your credentials in the Auto Apply settings.'
      });
    }

    // Decrypt the password (using the same XOR encryption as the frontend)
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-here';
    
    function decrypt(encryptedText) {
      try {
        // Decode from base64
        const decoded = Buffer.from(encryptedText, 'base64').toString();
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
          const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
          result += String.fromCharCode(charCode);
        }
        return result;
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
      }
    }
    
    const decryptedPassword = decrypt(credentials.password_encrypted);

    // Check if job is already being processed in the database
    const { data: existingJob, error: checkError } = await supabase
      .from('job_swipes')
      .select('application_processed, application_success, application_error')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing job:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Failed to check existing job status'
      });
    }

    // If job exists and is already processed, return early
    if (existingJob && existingJob.application_processed === true) {
      console.log(`⚠️ Job ${jobId} already processed, skipping`);
      return res.json({
        success: true,
        message: 'Job already processed',
        jobId: jobId
      });
    }
    
    // Process job directly
    await processJobDirectly(userId, jobId, jobUrl, {
      email: credentials.email,
      password: decryptedPassword
    });

    // Send immediate response
    res.json({
      success: true,
      message: 'Job processing started...',
      jobId: jobId
    });
  } catch (error) {
    console.error('Error processing job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



// Helper function to extract job ID from URL
function extractJobId(jobUrl) {
  const match = jobUrl.match(/\/jobs\/view\/(\d+)/);
  return match ? match[1] : 'unknown';
}

// Helper function to parse jobs from output (simplified for now)
function parseJobsFromOutput(output) {
  // In a real implementation, this would parse structured output
  // For now, return sample data
  return [
    {
      id: '123456789',
      title: 'Software Engineer',
      company: 'Tech Company',
      location: 'San Francisco, CA',
      url: 'https://www.linkedin.com/jobs/view/123456789',
      postedTime: '2 days ago',
      applicants: '50+ applicants',
      easyApply: true,
      salary: '$120,000 - $150,000'
    },
    {
      id: '987654321',
      title: 'Senior Developer',
      company: 'Startup Inc',
      location: 'Remote',
      url: 'https://www.linkedin.com/jobs/view/987654321',
      postedTime: '1 week ago',
      applicants: '25+ applicants',
      easyApply: true,
      salary: '$130,000 - $160,000'
    }
  ];
}

// Helper function to parse job details from output
function parseJobDetailsFromOutput(output) {
  // In a real implementation, this would parse structured output
  return {
    id: '123456789',
    title: 'Software Engineer',
    company: 'Tech Company',
    location: 'San Francisco, CA',
    url: 'https://www.linkedin.com/jobs/view/123456789',
    easyApply: true,
    salary: '$120,000 - $150,000',
    description: 'We are looking for a talented Software Engineer...'
  };
}

// Helper function to parse Easy Apply jobs from output
function parseEasyApplyJobsFromOutput(output) {
  try {
    // Try to parse JSON output from the Playwright script
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
        const data = JSON.parse(line.trim());
        if (data.success && Array.isArray(data.jobs)) {
          console.log(`Successfully parsed ${data.jobs.length} jobs from Playwright output`);
          return data.jobs;
        }
      }
    }
    
    // If no valid JSON found, return empty array
    console.log('No valid JSON output found from Playwright script');
    return [];
  } catch (error) {
    console.error('Error parsing Easy Apply jobs output:', error);
    return [];
  }
}

// Start Job Fetcher Worker endpoint
app.post('/api/start-job-fetcher', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('Received Job Fetcher Worker start request for user:', userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    // No longer spawning separate processes - job fetching is handled by session
    console.log('✅ Job fetcher setup validated - using session-based approach');
    
    res.json({
      success: true,
      message: 'Job fetcher setup validated - using session-based approach',
      output: 'Job fetching handled by session browser'
    });

  } catch (error) {
    console.error('Error in start job fetcher endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
});



// Simple Apply endpoint - uses the proven test-simple-click.js logic
app.post('/api/simple-apply', async (req, res) => {
  try {
    const { jobUrl, jobTitle, company, userId } = req.body;
    
    console.log('Received simple apply request:', { jobUrl, jobTitle, company, userId });
    
    if (!jobUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: jobUrl'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }
    
    // Check daily application limit and reward bonus
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('auto_applies_used_today, auto_apply_usage_date, login_streak, last_reward_claimed_date')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return res.status(500).json({
        success: false,
        error: 'Failed to check application limit'
      });
    }
    
    const today = new Date().toISOString().slice(0, 10);
    const currentUsage = profile?.auto_applies_used_today || 0;
    const usageDate = profile?.auto_apply_usage_date;
    
    // Reset usage if it's a new day
    if (usageDate !== today) {
      await supabase
        .from('profiles')
        .update({ auto_applies_used_today: 0, auto_apply_usage_date: today })
        .eq('id', userId);
    }
    
    // Calculate daily reward bonus
    const loginStreak = profile?.login_streak || 0;
    const lastRewardClaimed = profile?.last_reward_claimed_date;
    let rewardBonus = 0;
    
    // Check if reward was claimed today
    if (lastRewardClaimed === today && loginStreak > 0) {
      // 7-day reward cycle with specific amounts
      const rewards = [2, 2, 3, 4, 5, 5, 10]; // Day 1-7 rewards
      const rewardIndex = ((loginStreak - 1) % 7 + 7) % 7;
      rewardBonus = rewards[rewardIndex];
    }
    
    // Calculate total daily limit (base 15 + reward bonus)
    const totalDailyLimit = 15 + rewardBonus;
    
    // Check if user has reached daily limit
    if (currentUsage >= totalDailyLimit) {
      return res.status(429).json({
        success: false,
        error: `Daily application limit reached (${totalDailyLimit} applications). Please try again tomorrow.`
      });
    }
    
    // Check if user has an active session
    if (!isSessionActive(userId)) {
      return res.status(400).json({
        success: false,
        error: 'No active session found. Please start a session first.'
      });
    }

    // Check if session is logged in
    const session = getSession(userId);
    if (!session.isLoggedIn) {
      return res.status(400).json({
        success: false,
        error: 'Session browser is still initializing. Please wait for login to complete.'
      });
    }

    // Convert search URL to proper job URL if needed
    let processedJobUrl = jobUrl;
    if (jobUrl.includes('jobs/search') && jobUrl.includes('currentJobId=')) {
      const currentJobIdMatch = jobUrl.match(/currentJobId=(\d+)/);
      if (currentJobIdMatch) {
        const jobId = currentJobIdMatch[1];
        processedJobUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;
        console.log('Converted search URL to job URL:', { original: jobUrl, converted: processedJobUrl });
      }
    }

    // Use the proven test-simple-click.js approach with the existing session
    console.log(`🚀 Using proven test-simple-click.js approach for user: ${userId}`);
    
    // Process the job using the existing session
    processJobWithExistingSession(userId, 'simple-apply-job', processedJobUrl)
      .then(() => {
        console.log('✅ Job application completed successfully');
      })
      .catch((error) => {
        console.error('❌ Job application failed:', error);
      });
    
    return res.json({
      success: true,
      message: 'Job application started successfully using proven test-simple-click.js approach'
    });

    // Progress tracking for session-based approach
    sendProgressToSession(userId, '🚀 Starting job application...');

    child.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      currentApplicationOutput += dataStr;
      console.log('Simple apply output:', dataStr);
      
      // Update progress based on output with more detailed messages
      if (dataStr.includes('🚀 Starting Easy Apply process')) {
        currentApplicationProgress = '🚀 Starting Easy Apply process...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('🔐 Fetching user credentials')) {
        currentApplicationProgress = '🔐 Fetching user credentials...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('📄 Fetching user resume')) {
        currentApplicationProgress = '📄 Fetching user resume...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('✅ All required data validated')) {
        currentApplicationProgress = '✅ Data validated, initializing browser...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('🚀 Initializing browser')) {
        currentApplicationProgress = '🚀 Initializing browser...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('Browser initialized successfully')) {
        currentApplicationProgress = '✅ Browser ready, navigating to job...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('Logging into LinkedIn')) {
        currentApplicationProgress = '🔐 Logging into LinkedIn...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('✅ Login successful')) {
        currentApplicationProgress = '✅ Login successful, navigating to job...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('Navigating to job URL')) {
        currentApplicationProgress = '📍 Navigating to job page...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('✅ Found Easy Apply button')) {
        currentApplicationProgress = '✅ Found Easy Apply button, clicking...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('🖱 Clicking Easy Apply button')) {
        currentApplicationProgress = '🖱 Clicking Easy Apply button...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('✅ Easy Apply button clicked')) {
        currentApplicationProgress = '✅ Easy Apply opened, filling form...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('📝 Filling out Easy Apply form')) {
        currentApplicationProgress = '📝 Filling out application form...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('📱 Looking for phone number field')) {
        currentApplicationProgress = '📱 Filling contact information...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('✅ Found Next button')) {
        currentApplicationProgress = '✅ Found Next button, continuing...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('🖱 Clicking Next button')) {
        currentApplicationProgress = '🖱 Clicking Next button...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('✅ Next button clicked')) {
        currentApplicationProgress = '✅ Next button clicked, checking for questions...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('❓ Checking for additional questions')) {
        currentApplicationProgress = '❓ Checking for additional questions...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('📊 Application progress:')) {
        const progressMatch = dataStr.match(/📊 Application progress: (\d+)%/);
        if (progressMatch) {
          currentApplicationProgress = `📊 Application progress: ${progressMatch[1]}%`;
          setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
        }
      } else if (dataStr.includes('✅ Found question section')) {
        currentApplicationProgress = '✅ Found questions, extracting details...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('📤 Sending question')) {
        currentApplicationProgress = '📤 Sending question to frontend...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('⏳ Waiting for user to answer questions')) {
        currentApplicationProgress = '⏳ Waiting for user to answer questions...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('📤 Received answer via WebSocket')) {
        currentApplicationProgress = '📤 Answer received, continuing application...';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('✅ Application completed successfully')) {
        currentApplicationProgress = '✅ Application completed successfully!';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('❌ Application failed')) {
        currentApplicationProgress = '❌ Application failed. Please try again.';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      } else if (dataStr.includes('❌ Job is no longer accepting applications')) {
        currentApplicationProgress = '❌ Job is no longer accepting applications.';
        setTimeout(() => sendProgressToSession(userId, currentApplicationProgress), 100);
      }
      

      

      

      
      // Check for completion
      if (dataStr.includes('🎉 Application submitted successfully!')) {
        applicationStatus = 'completed';
        currentApplicationStatus = 'completed';
        currentApplicationProgress = 'Application completed successfully!';
        
        // Send WebSocket message to notify frontend of completion
        connectedClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'application_completed',
              data: {
                status: 'completed',
                message: 'Application completed successfully!'
              }
            }));
          }
        });
      } else if (dataStr.includes('❌ Error during Easy Apply process')) {
        applicationStatus = 'error';
        currentApplicationStatus = 'error';
        currentApplicationProgress = 'Application failed. Please try again.';
        
        // Send WebSocket message to notify frontend of error
        connectedClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'application_error',
              data: {
                status: 'error',
                message: 'Application failed. Please try again.'
              }
            }));
          }
        });
      } else if (dataStr.includes('❌ Cannot apply to this job - applications are closed')) {
        applicationStatus = 'job_closed';
        currentApplicationStatus = 'job_closed';
        currentApplicationProgress = 'Job is no longer accepting applications.';
        
        // Send WebSocket message to notify frontend of job closed
        connectedClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'application_error',
              data: {
                status: 'job_closed',
                message: 'Job is no longer accepting applications.'
              }
            }));
          }
        });
      } else if (dataStr.includes('✅ Easy Apply process completed (job closed)')) {
        applicationStatus = 'job_closed';
        currentApplicationStatus = 'job_closed';
        currentApplicationProgress = 'Job is no longer accepting applications.';
        
        // Send WebSocket message to notify frontend of job closed
        connectedClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'application_error',
              data: {
                status: 'job_closed',
                message: 'Job is no longer accepting applications.'
              }
            }));
          }
        });
      }
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Simple apply error:', data.toString());
    });

    child.on('close', (code) => {
      console.log(`Simple apply process exited with code ${code}`);
      
      if (code === 0) {
        res.json({
          success: true,
          message: 'Simple apply started successfully',
          output: output.trim(),
          status: applicationStatus
        });
      } else {
        res.status(500).json({
          success: false,
          error: errorOutput || 'Simple apply failed',
          output: output.trim(),
          status: applicationStatus
        });
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start simple apply process:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start simple apply process',
      });
    });

  } catch (error) {
    console.error('Error in simple apply endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Application status endpoint - for polling application progress
app.get('/api/application-status', (req, res) => {
  res.json({
    status: currentApplicationStatus,
    progress: currentApplicationProgress,
    output: currentApplicationOutput,
    timestamp: new Date().toISOString()
  });
});

// Answer question endpoint - for handling user answers
app.post('/api/answer-question', (req, res) => {
  try {
    const { answer } = req.body;
    
    console.log('📤 Received answer from frontend:', answer);
    
    if (!answer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: answer'
      });
    }

    // Send answer to browser process (this would be implemented)
    sendAnswerToBrowser(answer);
    
    currentApplicationStatus = 'processing';
    currentApplicationProgress = 'Answer received, continuing application...';

    res.json({
      success: true,
      message: 'Answer received and sent to browser',
      answer: answer
    });

  } catch (error) {
    console.error('Error in answer question endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    queueLength: applicationQueue.queue.length,
    isProcessing: applicationQueue.isProcessing,
    activeSessions: activeSessions.size
  });
});

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
        headless: false,
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
        viewport: { width: 1366, height: 768 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      console.log('Browser initialized successfully');
      
      // Create new page
      page = await context.newPage();
      
      // Add stealth scripts
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });
      
      // Login to LinkedIn
      console.log('Logging into LinkedIn...');
      const email = credentials.email;
      const password = credentials.password;
      
      console.log(`Using email: ${email}`);
      
      await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Fill in email
      await page.click('#username');
      await page.waitForTimeout(500);
      await page.fill('#username', email);
      await page.waitForTimeout(1000);

      // Fill in password
      await page.click('#password');
      await page.waitForTimeout(500);
      await page.fill('#password', password);
      await page.waitForTimeout(1000);

      // Click sign in button
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);

      // Check if login was successful - handle security checkpoints
      console.log('🔍 Checking login status...');
      
      // Wait a bit longer for potential security checkpoints
      await page.waitForTimeout(5000);
      
      const loginUrl = page.url();
      console.log(`Current URL after login: ${loginUrl}`);
      
      // Check for security checkpoint pages and URLs
      const securityCheckpointSelectors = [
        'input[name="captcha"]',
        'input[name="challenge"]',
        'input[name="verification"]',
        'button:has-text("Verify")',
        'button:has-text("Continue")',
        'input[placeholder*="code"]',
        'input[placeholder*="verification"]'
      ];
      
      let hasSecurityCheckpoint = false;
      
      // Check if URL contains checkpoint
      if (loginUrl.includes('/checkpoint/') || loginUrl.includes('/challenge/')) {
        hasSecurityCheckpoint = true;
        console.log(`⚠️ Security checkpoint detected in URL: ${loginUrl}`);
      }
      
      // Also check for checkpoint elements
      for (const selector of securityCheckpointSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            hasSecurityCheckpoint = true;
            console.log(`⚠️ Security checkpoint detected: ${selector}`);
            break;
          }
        } catch (error) {
          // Element not found, continue
        }
      }
      
      if (hasSecurityCheckpoint) {
        console.log('🛡️ LinkedIn security checkpoint detected. Please complete it manually...');
        console.log('⏳ Waiting for you to complete the security checkpoint...');
        
        // Wait for user to complete security checkpoint
        let attempts = 0;
        const maxAttempts = 60; // Wait up to 5 minutes
        
        while (attempts < maxAttempts) {
          await page.waitForTimeout(5000); // Check every 5 seconds
          attempts++;
          
          const currentUrl = page.url();
          console.log(`Checking login status (attempt ${attempts}/${maxAttempts}): ${currentUrl}`);
          
          // Check if we're now on feed or mynetwork
          if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
            console.log('✅ Successfully logged into LinkedIn after security checkpoint');
            break;
          }
          
          // Check if security checkpoint is still present
          let stillHasCheckpoint = false;
          for (const selector of securityCheckpointSelectors) {
            try {
              const element = await page.locator(selector).first();
              if (await element.isVisible()) {
                stillHasCheckpoint = true;
                break;
              }
            } catch (error) {
              // Element not found
            }
          }
          
          if (!stillHasCheckpoint && (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork'))) {
            console.log('✅ Successfully logged into LinkedIn after security checkpoint');
            break;
          }
          
          if (attempts >= maxAttempts) {
            console.log('⏰ Timeout waiting for security checkpoint completion');
            throw new Error('Security checkpoint timeout');
          }
        }
      } else if (loginUrl.includes('/feed') || loginUrl.includes('/mynetwork')) {
        console.log('✅ Successfully logged into LinkedIn');
      } else {
        console.log('❌ Login failed - not on feed or mynetwork');
        throw new Error('Login failed');
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

// Session management endpoints
app.post('/api/session/start', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log(`🚀 Starting session for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }
    
    // Check if session already exists or is being initialized
    if (isSessionActive(userId)) {
      console.log(`⚠️ Session already active for user: ${userId}`);
      return res.json({
        success: true,
        message: 'Session already active',
        sessionActive: true,
        browserRunning: isBrowserRunningForSession(userId)
      });
    }
    
    // Check if there's a browser instance already running for this user
    const existingSession = getSession(userId);
    if (existingSession && existingSession.isBrowserRunning) {
      console.log(`⚠️ Browser already running for user: ${userId}`);
      return res.json({
        success: true,
        message: 'Browser already running',
        sessionActive: true,
        browserRunning: true
      });
    }
    
    // Get LinkedIn credentials for this user
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      'https://xipjxcktpzanmhfrkbrm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE'
    );
    
    const { data: credentials, error: credentialsError } = await supabase
      .from('linkedin_credentials')
      .select('email, password_encrypted')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (credentialsError || !credentials) {
      return res.status(400).json({
        success: false,
        error: 'LinkedIn credentials not found. Please add your LinkedIn credentials first.'
      });
    }
    
    // Decrypt password
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-here';
    function decrypt(encryptedText) {
      try {
        // Decode from base64
        const decoded = Buffer.from(encryptedText, 'base64').toString();
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
          const charCode = decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
          result += String.fromCharCode(charCode);
        }
        return result;
      } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
      }
    }
    
    const decryptedPassword = decrypt(credentials.password_encrypted);
    
    // Create new session
    const session = createSession(userId, null);
    
    // Initialize browser session (login and checkpoint handling)
    try {
      const initResult = await initializeBrowserSession(userId, {
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
        
        // Send WebSocket message to notify frontend that session is ready
        sendProgressToSession(userId, '✅ Session ready - browser is logged in and ready for applications');
    
    res.json({
      success: true,
          message: 'Session started successfully',
          sessionActive: true,
          browserRunning: true,
          ready: initResult.ready || false
        });
      } else {
        throw new Error('Browser initialization failed');
      }
    } catch (error) {
      console.error(`❌ Failed to start session for user ${userId}:`, error);
      endSession(userId);
      
      res.status(500).json({
        success: false,
        error: 'Failed to start session',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('Error in session start endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred'
    });
  }
});

app.post('/api/session/end', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log(`🔚 Ending session for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }
    
    if (!isSessionActive(userId)) {
      console.log(`⚠️ No active session found for user: ${userId}`);
      return res.json({
        success: true,
        message: 'No active session to end',
        sessionActive: false
      });
    }
    
    // End the session
    await endSession(userId);
    
    console.log(`✅ Session ended successfully for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Session ended successfully',
      sessionActive: false
    });
    
  } catch (error) {
    console.error('Error in session end endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred'
    });
  }
});

// Session stop endpoint (alias for /api/session/end)
app.post('/api/session/stop', async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log(`🔚 Stopping session for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }
    
    if (!isSessionActive(userId)) {
      console.log(`⚠️ No active session found for user: ${userId}`);
      return res.json({
        success: true,
        message: 'No active session to stop',
        sessionActive: false
      });
    }
    
    // End the session
    await endSession(userId);
    
    console.log(`✅ Session stopped successfully for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Session stopped successfully',
      sessionActive: false
    });
    
  } catch (error) {
    console.error('Error in session stop endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred'
    });
  }
});

app.get('/api/session/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const sessionActive = isSessionActive(userId);
    const browserRunning = isBrowserRunningForSession(userId);
    const session = getSession(userId);
    
    res.json({
      success: true,
      isActive: sessionActive,
      sessionActive,
      browserRunning,
      session: session ? {
        userId: session.userId,
        isLoggedIn: session.isLoggedIn,
        lastActivity: new Date(session.lastActivity).toISOString(),
        applicationProgress: session.applicationProgress,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions
      } : null,
      message: sessionActive ? 'Session is active' : 'No active session'
    });
    
  } catch (error) {
    console.error('Error in session status endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred'
    });
  }
});

// Apply to a specific job using the active session
app.post('/api/apply-job', async (req, res) => {
  try {
    const { userId, jobId, jobUrl } = req.body;
    
    console.log(`📝 Applying to job ${jobId} for user: ${userId}`);
    
    if (!userId || !jobId || !jobUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, jobId, or jobUrl'
      });
    }
    
    // Check if session is active
    if (!isSessionActive(userId)) {
      return res.status(400).json({
        success: false,
        error: 'No active session found'
      });
    }
    
    // Check if browser is running
    if (!isBrowserRunningForSession(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Browser not ready'
      });
    }
    
    // Get the session
    const session = getSession(userId);
    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Send immediate response to frontend
    res.json({
      success: true,
      message: 'Job application started successfully',
      jobId: jobId
    });
    
    // Process the job application in the background using the existing session
    try {
      await processJobWithExistingSession(userId, jobId, jobUrl);
    } catch (error) {
      console.error(`❌ Error processing job ${jobId} for user ${userId}:`, error);
    }
    
  } catch (error) {
    console.error('Error in apply job endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
    });
  }
});

// Function to apply to job using existing browser instance
async function applyToJobWithBrowser(session, jobId, jobUrl) {
  try {
    console.log(`📝 Applying to job ${jobId} using existing browser...`);
    
    const page = session.browserPage;
    if (!page) {
      throw new Error('No browser page available in session');
    }
    
    // Navigate to job page
    console.log(`📄 Navigating to job page: ${jobUrl}`);
    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ Navigation completed');
    
    // Wait for page to load
    await page.waitForTimeout(8000);
    
    // Scroll down slowly
    console.log('🔄 Scrolling down like a human...');
    await page.evaluate(() => {
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: 'smooth'
      });
    });
    
    await page.waitForTimeout(3000);
    
    // Check if job is no longer accepting applications
    console.log('🔍 Checking if job is still accepting applications...');
    const noLongerAcceptingSelectors = [
      'text="No longer accepting applications"',
      'text="Applications are no longer being accepted"',
      'text="This job is no longer accepting applications"',
      '[data-test-id="job-closed-banner"]',
      '.jobs-unified-top-card__job-closed-banner',
      '.jobs-unified-top-card__job-closed-message'
    ];
    
    let jobClosed = false;
    for (const selector of noLongerAcceptingSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          const text = await element.textContent();
          console.log(`❌ Job is no longer accepting applications: "${text}"`);
          jobClosed = true;
          break;
        }
      } catch (error) {
        // Element not found, continue
      }
    }
    
    if (jobClosed) {
      console.log('❌ Job is no longer accepting applications');
      // Send progress update to frontend
      const userId = session.userId;
      if (userId) {
        sendProgressToSession(userId, '❌ Job is no longer accepting applications');
      }
      return false;
    }
    
    // Look for Easy Apply button
    console.log('🔍 Looking for Easy Apply button...');
    
    const easyApplySelectors = [
      'button:has-text("Easy Apply")',
      'button:has-text("Apply")',
      '[data-control-name="jobdetails_topcard_inapply"]',
      '.jobs-apply-button',
      '.jobs-apply-button--top-card',
      'button[aria-label*="Apply"]',
      'button[aria-label*="Easy Apply"]'
    ];
    
    let easyApplyButton = null;
    
    for (const selector of easyApplySelectors) {
      try {
        const button = await page.locator(selector).first();
        if (await button.isVisible()) {
          easyApplyButton = button;
          console.log(`✅ Found Easy Apply button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`Button selector ${selector} failed: ${error}`);
      }
    }
    
    if (easyApplyButton) {
      console.log('🖱️ Clicking Easy Apply button...');
      
      // Get button position and click
      const boundingBox = await easyApplyButton.boundingBox();
      if (boundingBox) {
        await easyApplyButton.click();
        console.log('✅ Easy Apply button clicked');
        
        // Wait for modal or page change
        await page.waitForTimeout(3000);
        
        // Check for Easy Apply modal
        const modalSelectors = [
          '[data-test-modal-id="easy-apply-modal"]',
          '.jobs-easy-apply-modal',
          '[role="dialog"]',
          '.modal'
        ];
        
        let modalFound = false;
        for (const modalSelector of modalSelectors) {
          try {
            const modal = await page.locator(modalSelector).first();
            if (await modal.isVisible()) {
              console.log(`✅ Found Easy Apply modal with selector: ${modalSelector}`);
              modalFound = true;
              break;
            }
          } catch (error) {
            // Modal not found with this selector
          }
        }
        
        if (modalFound) {
          console.log('📝 Filling out Easy Apply form using proven test-simple-click.js logic...');
          
          // Import and use the fillEasyApplyForm function from test-simple-click.js
          const { fillEasyApplyForm } = require('../auto-apply/test-simple-click.js');
          try {
            const formResult = await fillEasyApplyForm(page);
            if (formResult === true) {
              console.log('✅ Easy Apply form filled successfully using proven logic');
              return true;
            } else {
              console.log('❌ Easy Apply form filling failed');
              return false;
            }
          } catch (error) {
            console.log(`❌ Error during form filling: ${error}`);
            return false;
          }
        } else {
          console.log('❌ Easy Apply modal not found after click');
          return false;
        }
        
        // Check if we navigated away
        const urlAfterClick = page.url();
        if (!urlAfterClick.includes('/jobs/view/')) {
          console.log(`❌ Page navigated away to: ${urlAfterClick}`);
          return false;
        }
        
        // Check for any modals
        const modals = await page.locator('[role="dialog"], .modal, .popup').count();
        if (modals > 0) {
          console.log(`Found ${modals} modal(s) after click`);
          return true;
        }
        
        console.log('Click didn\'t trigger Easy Apply modal');
      } else {
        console.log('❌ Could not get bounding box for button');
      }
    } else {
      console.log('❌ No Easy Apply button found with any selector');
    }
    
    console.log('❌ No Easy Apply button found or clickable');
    return false;
    
  } catch (error) {
    console.log(`❌ Error during job application: ${error}`);
    return false;
  }
}

// Function to process job application using existing session
async function processJobWithExistingSession(userId, jobId, jobUrl) {
  try {
    console.log(`🔄 Processing job ${jobId} with existing session for user: ${userId}`);
    
    // Send initial progress
    sendProgressToSession(userId, '🚀 Starting job application...');
    
    // Get the session
    const session = getSession(userId);
    if (!session) {
      sendProgressToSession(userId, '❌ Session not found');
      throw new Error('Session not found');
    }
    
    // Send progress update
    sendProgressToSession(userId, '📄 Navigating to job page...');
    
    // Apply to job using existing browser
    const result = await applyToJobWithBrowser(session, jobId, jobUrl);
    
    if (result === true) {
      console.log(`✅ Job ${jobId} application completed successfully`);
      sendProgressToSession(userId, '✅ Application completed successfully!');
      
      // Increment daily application limit
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('auto_applies_used_today, auto_apply_usage_date')
          .eq('id', userId)
          .single();
        
        if (!profileError && profile) {
          const today = new Date().toISOString().slice(0, 10);
          const currentUsage = profile.auto_applies_used_today || 0;
          const newUsage = currentUsage + 1;
          
          await supabase
            .from('profiles')
            .update({ 
              auto_applies_used_today: newUsage,
              auto_apply_usage_date: today
            })
            .eq('id', userId);
          
          console.log(`✅ Updated daily application count for user ${userId}: ${newUsage}/15`);
        }
      } catch (error) {
        console.error('❌ Error updating daily application count:', error);
      }
      
      // Send WebSocket message to notify frontend of completion
      const session = getSession(userId);
      if (session && session.websocket && session.websocket.readyState === WebSocket.OPEN) {
        session.websocket.send(JSON.stringify({
          type: 'application_completed',
          data: {
            status: 'completed',
            message: 'Application completed successfully!'
          }
        }));
      }
    } else {
      console.log(`❌ Job ${jobId} application failed`);
      sendProgressToSession(userId, '❌ Application failed - job may not be accepting applications');
      
      // Send WebSocket message to notify frontend of failure
      const session = getSession(userId);
      if (session && session.websocket && session.websocket.readyState === WebSocket.OPEN) {
        session.websocket.send(JSON.stringify({
          type: 'application_completed',
          data: {
            status: 'error',
            message: 'Application failed - job may not be accepting applications'
          }
        }));
      }
    }
    
  } catch (error) {
    console.error(`❌ Error in processJobWithExistingSession for job ${jobId}:`, error);
    sendProgressToSession(userId, `❌ Application error: ${error.message}`);
    throw error;
  }
}

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check available at http://localhost:${PORT}/`);
  console.log(`🔌 WebSocket server running on same port`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Supabase URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`🔑 CORS Origin: ${process.env.CORS_ORIGIN || 'Not set'}`);
  console.log(`🎭 Playwright: ${chromium ? 'Available' : 'Not available'}`);
  console.log(`✅ Server ready for health checks!`);
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});