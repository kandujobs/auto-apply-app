const express = require('express');
const router = express.Router();
const { sessionManager } = require('../services/sessionManager');
const { broadcastToUser } = require('../config/websocket');

// Start a new session
router.post('/start', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if session already exists
    if (sessionManager.isSessionActive(userId)) {
      return res.json({ 
        message: 'Session already active',
        session: sessionManager.getSession(userId)
      });
    }

    // Create new session
    const session = sessionManager.createSession(userId);
    
    res.json({ 
      message: 'Session started successfully',
      session
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// End a session
router.post('/end', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await sessionManager.endSession(userId);
    
    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Stop a session (alias for end)
router.post('/stop', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await sessionManager.endSession(userId);
    
    res.json({ message: 'Session stopped successfully' });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

// Get session status
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const session = sessionManager.getSession(userId);
    
    if (!session) {
      return res.json({ 
        isActive: false,
        message: 'No active session found'
      });
    }

    res.json({
      isActive: session.isActive,
      isBrowserRunning: session.isBrowserRunning,
      applicationProgress: session.applicationProgress,
      currentQuestion: session.currentQuestion,
      totalQuestions: session.totalQuestions,
      lastActivity: session.lastActivity
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({ error: 'Failed to get session status' });
  }
});

// Update session status
router.post('/status', async (req, res) => {
  try {
    const { userId, status, progress, currentQuestion, totalQuestions } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const session = sessionManager.getSession(userId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update session properties
    if (status !== undefined) session.isActive = status;
    if (progress !== undefined) session.applicationProgress = progress;
    if (currentQuestion !== undefined) session.currentQuestion = currentQuestion;
    if (totalQuestions !== undefined) session.totalQuestions = totalQuestions;
    
    session.lastActivity = Date.now();

    // Broadcast status update to connected clients
    broadcastToUser(userId, {
      type: 'session_status_update',
      status: session.isActive ? 'active' : 'inactive',
      isBrowserRunning: session.isBrowserRunning,
      applicationProgress: session.applicationProgress,
      currentQuestion: session.currentQuestion,
      totalQuestions: session.totalQuestions
    });

    res.json({ 
      message: 'Session status updated successfully',
      session
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
});

module.exports = router;
