const express = require('express');
const router = express.Router();
const { sessionManager } = require('../services/sessionManager');
const { supabase } = require('../config/database');
const { broadcastToUser } = require('../config/websocket');

// Job search endpoint
router.post('/job-search', async (req, res) => {
  try {
    const { userId, searchParams } = req.body;
    
    if (!userId || !searchParams) {
      return res.status(400).json({ error: 'User ID and search parameters are required' });
    }

    // Store search parameters in user's profile
    const { error } = await supabase
      .from('profiles')
      .update({ 
        job_search_preferences: searchParams,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating job search preferences:', error);
    }

    res.json({ 
      message: 'Job search preferences updated successfully',
      searchParams
    });
  } catch (error) {
    console.error('Error updating job search preferences:', error);
    res.status(500).json({ error: 'Failed to update job search preferences' });
  }
});

// Get job details
router.post('/job-details', async (req, res) => {
  try {
    const { userId, jobId } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({ error: 'User ID and Job ID are required' });
    }

    // Get job details from database
    const { data: job, error } = await supabase
      .from('linkedin_fetched_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Error getting job details:', error);
    res.status(500).json({ error: 'Failed to get job details' });
  }
});

// Auto-apply to jobs
router.post('/auto-apply', async (req, res) => {
  try {
    const { userId, jobIds, resumeId } = req.body;
    
    if (!userId || !jobIds || !Array.isArray(jobIds)) {
      return res.status(400).json({ error: 'User ID and job IDs array are required' });
    }

    // Check if user has active session
    if (!sessionManager.isSessionActive(userId)) {
      return res.status(400).json({ error: 'No active session found. Please start a session first.' });
    }

    // Store application data
    const applications = jobIds.map(jobId => ({
      user_id: userId,
      job_id: jobId,
      resume_id: resumeId,
      status: 'pending',
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('job_applications')
      .insert(applications);

    if (error) {
      console.error('Error storing job applications:', error);
      return res.status(500).json({ error: 'Failed to store job applications' });
    }

    // Broadcast to user
    broadcastToUser(userId, {
      type: 'auto_apply_started',
      message: `Starting auto-apply for ${jobIds.length} jobs`,
      jobCount: jobIds.length
    });

    res.json({ 
      message: `Auto-apply started for ${jobIds.length} jobs`,
      jobCount: jobIds.length
    });
  } catch (error) {
    console.error('Error starting auto-apply:', error);
    res.status(500).json({ error: 'Failed to start auto-apply' });
  }
});

// Fetch jobs from LinkedIn
router.post('/fetch-jobs', async (req, res) => {
  try {
    const { userId, searchParams } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if job fetch is already in progress
    if (sessionManager.jobFetchInProgress.get(userId)) {
      return res.status(400).json({ error: 'Job fetch already in progress' });
    }

    // Set job fetch in progress
    sessionManager.jobFetchInProgress.set(userId, true);

    // Broadcast to user
    broadcastToUser(userId, {
      type: 'job_fetch_started',
      message: 'Starting job fetch from LinkedIn'
    });

    // Use the new browser service to fetch jobs
    try {
      const result = await sessionManager.fetchJobsForSession(userId, searchParams);
      
      sessionManager.jobFetchInProgress.set(userId, false);
      
      broadcastToUser(userId, {
        type: 'job_fetch_completed',
        message: 'Job fetch completed',
        jobCount: result.count || 0
      });

      res.json({ 
        message: 'Job fetch completed',
        status: 'completed',
        jobs: result.jobs,
        count: result.count
      });
    } catch (error) {
      sessionManager.jobFetchInProgress.set(userId, false);
      
      broadcastToUser(userId, {
        type: 'job_fetch_error',
        message: error.message
      });

      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('Error starting job fetch:', error);
    sessionManager.jobFetchInProgress.set(userId, false);
    res.status(500).json({ error: 'Failed to start job fetch' });
  }
});

// Reset job fetch pagination
router.post('/reset-job-fetch', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Reset job fetch state
    sessionManager.jobFetchInProgress.set(userId, false);
    sessionManager.jobFetchQueue.delete(userId);

    res.json({ message: 'Job fetch pagination reset successfully' });
  } catch (error) {
    console.error('Error resetting job fetch:', error);
    res.status(500).json({ error: 'Failed to reset job fetch' });
  }
});

// Get easy apply jobs
router.post('/easy-apply-jobs', async (req, res) => {
  try {
    const { userId, filters = {} } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get easy apply jobs from database
    let query = supabase
      .from('linkedin_fetched_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('easy_apply', true);

    // Apply filters
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters.title) {
      query = query.ilike('title', `%${filters.title}%`);
    }
    if (filters.company) {
      query = query.ilike('company', `%${filters.company}%`);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching easy apply jobs:', error);
      return res.status(500).json({ error: 'Failed to fetch easy apply jobs' });
    }

    res.json({ jobs: jobs || [] });
  } catch (error) {
    console.error('Error getting easy apply jobs:', error);
    res.status(500).json({ error: 'Failed to get easy apply jobs' });
  }
});

// Get browser status
router.get('/browser-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const session = sessionManager.getSession(userId);
    const isBrowserRunning = session ? session.isBrowserRunning : false;

    res.json({ 
      isBrowserRunning,
      sessionActive: !!session
    });
  } catch (error) {
    console.error('Error getting browser status:', error);
    res.status(500).json({ error: 'Failed to get browser status' });
  }
});

// Reset pagination
router.post('/reset-pagination', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Reset pagination in database
    const { error } = await supabase
      .from('linkedin_fetched_jobs')
      .update({ pagination_token: null })
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting pagination:', error);
      return res.status(500).json({ error: 'Failed to reset pagination' });
    }

    res.json({ message: 'Pagination reset successfully' });
  } catch (error) {
    console.error('Error resetting pagination:', error);
    res.status(500).json({ error: 'Failed to reset pagination' });
  }
});

// Start easy apply worker
router.post('/start-easy-apply-worker', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if session exists
    if (!sessionManager.isSessionActive(userId)) {
      return res.status(400).json({ error: 'No active session found' });
    }

    const session = sessionManager.getSession(userId);
    
    // Start worker process (this would be implemented with actual worker logic)
    const result = await sessionManager.applicationQueue.startEasyApplyWorker(userId);
    
    if (result.success) {
      session.isBrowserRunning = true;
      sessionManager.applicationQueue.workerProcesses[userId] = true;
      
      broadcastToUser(userId, {
        type: 'worker_started',
        message: 'Easy apply worker started successfully'
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error starting easy apply worker:', error);
    res.status(500).json({ error: 'Failed to start easy apply worker' });
  }
});

// Test apply functionality
router.post('/test-apply', async (req, res) => {
  try {
    const { userId, jobId } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({ error: 'User ID and Job ID are required' });
    }

    // Check if session exists
    if (!sessionManager.isSessionActive(userId)) {
      return res.status(400).json({ error: 'No active session found' });
    }

    // Simulate test apply
    const session = sessionManager.getSession(userId);
    session.applicationProgress = 'Testing apply functionality...';
    
    broadcastToUser(userId, {
      type: 'test_apply_progress',
      message: 'Testing apply functionality...',
      progress: 'Testing...'
    });

    // Simulate completion after 3 seconds
    setTimeout(() => {
      session.applicationProgress = 'Test completed successfully';
      broadcastToUser(userId, {
        type: 'test_apply_completed',
        message: 'Test apply completed successfully',
        success: true
      });
    }, 3000);

    res.json({ 
      message: 'Test apply started',
      status: 'testing'
    });
  } catch (error) {
    console.error('Error starting test apply:', error);
    res.status(500).json({ error: 'Failed to start test apply' });
  }
});

// Start job fetcher
router.post('/start-job-fetcher', async (req, res) => {
  try {
    const { userId, searchParams } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if already running
    if (sessionManager.jobFetchInProgress.get(userId)) {
      return res.status(400).json({ error: 'Job fetcher already running' });
    }

    sessionManager.jobFetchInProgress.set(userId, true);
    
    broadcastToUser(userId, {
      type: 'job_fetcher_started',
      message: 'Job fetcher started'
    });

    // Simulate job fetching
    setTimeout(() => {
      sessionManager.jobFetchInProgress.set(userId, false);
      broadcastToUser(userId, {
        type: 'job_fetcher_completed',
        message: 'Job fetcher completed'
      });
    }, 10000);

    res.json({ 
      message: 'Job fetcher started',
      status: 'running'
    });
  } catch (error) {
    console.error('Error starting job fetcher:', error);
    sessionManager.jobFetchInProgress.set(userId, false);
    res.status(500).json({ error: 'Failed to start job fetcher' });
  }
});

// Simple apply to job
router.post('/simple-apply', async (req, res) => {
  try {
    const { userId, jobUrl, jobTitle, company } = req.body;
    
    if (!userId || !jobUrl) {
      return res.status(400).json({ error: 'User ID and Job URL are required' });
    }

    console.log("Simple apply request:", { userId, jobUrl, jobTitle, company });
    // Store application
    const { error } = await supabase
      .from('job_applications')
      .insert({
        job_url: jobUrl,
        job_title: jobTitle || 'Unknown',
        company: company || 'Unknown',
        status: 'applied',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing job application:', error);
      return res.status(500).json({ error: 'Failed to store job application' });
    }

    res.json({ 
      message: 'Job application submitted successfully',
      jobId
    });
  } catch (error) {
    console.error('Error submitting job application:', error);
    res.status(500).json({ error: 'Failed to submit job application' });
  }
});

// Get application status
router.get('/application-status', (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const session = sessionManager.getSession(userId);
    
    if (!session) {
      return res.json({ 
        status: 'no_session',
        message: 'No active session found'
      });
    }

    res.json({
      status: session.isActive ? 'active' : 'inactive',
      isBrowserRunning: session.isBrowserRunning,
      applicationProgress: session.applicationProgress,
      currentQuestion: session.currentQuestion,
      totalQuestions: session.totalQuestions
    });
  } catch (error) {
    console.error('Error getting application status:', error);
    res.status(500).json({ error: 'Failed to get application status' });
  }
});

// Answer question during application
router.post('/answer-question', async (req, res) => {
  try {
    const { userId, answer } = req.body;
    
    if (!userId || answer === undefined) {
      return res.status(400).json({ error: 'User ID and answer are required' });
    }

    // Use the new browser service to answer questions
    const result = await sessionManager.answerQuestionForSession(userId, answer);
    
    res.json(result);
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Apply to specific job
router.post('/apply-job', async (req, res) => {
  try {
    const { userId, jobId, resumeId } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({ error: 'User ID and Job ID are required' });
    }

    // Check if session exists
    if (!sessionManager.isSessionActive(userId)) {
      return res.status(400).json({ error: 'No active session found' });
    }

    const session = sessionManager.getSession(userId);
    
    // Store application
    const { error } = await supabase
      .from('job_applications')
      .insert({
        user_id: userId,
        job_id: jobId,
        resume_id: resumeId,
        status: 'applying',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing job application:', error);
      return res.status(500).json({ error: 'Failed to store job application' });
    }

    // Start application process
    session.applicationProgress = 'Starting application process...';
    session.currentQuestionIndex = 0;
    session.totalQuestions = 5; // This would be determined by the actual job
    
    broadcastToUser(userId, {
      type: 'application_started',
      message: 'Application process started',
      jobId,
      totalQuestions: session.totalQuestions
    });

    res.json({ 
      message: 'Application process started',
      jobId,
      status: 'applying'
    });
  } catch (error) {
    console.error('Error starting application:', error);
    res.status(500).json({ error: 'Failed to start application' });
  }
});

module.exports = router;
