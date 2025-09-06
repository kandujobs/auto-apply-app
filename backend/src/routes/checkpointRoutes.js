const express = require('express');
const router = express.Router();
const { setState, getState, clearState } = require('../checkpointStore');
const { sessionManager } = require('../services/sessionManager');

/**
 * Get checkpoint status for a user (polling endpoint)
 * GET /api/checkpoint/:userId/status
 */
router.get('/:userId/status', (req, res) => {
  try {
    const { userId } = req.params;
    const state = getState(userId);
    
    // Set no-cache headers for real-time polling
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({ 
      userId, 
      ...state 
    });
  } catch (error) {
    console.error('Error getting checkpoint status:', error);
    res.status(500).json({ error: 'Failed to get checkpoint status' });
  }
});

/**
 * Get latest screenshot of the checkpoint page
 * GET /api/checkpoint/:userId/frame.png
 */
router.get('/:userId/frame.png', async (req, res) => {
  try {
    const { userId } = req.params;
    const state = getState(userId);
    
    if (state.state !== 'checkpoint_required') {
      return res.status(409).json({ error: 'No checkpoint required' });
    }
    
    // Get the session and browser page
    const session = sessionManager.getSession(userId);
    if (!session || !session.browserPage) {
      return res.status(410).json({ error: 'Session or page not found' });
    }
    
    const page = session.browserPage;
    
    // Take a fresh screenshot
    const screenshotBuffer = await page.screenshot({ 
      type: 'png',
      fullPage: true 
    });
    
    // Set headers for image response
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.send(screenshotBuffer);
  } catch (error) {
    console.error('Error getting checkpoint screenshot:', error);
    res.status(500).json({ error: 'Failed to get screenshot' });
  }
});

/**
 * Execute user actions on the checkpoint page
 * POST /api/checkpoint/:userId/action
 */
router.post('/:userId/action', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, selector, text, x, y, key } = req.body || {};
    
    const state = getState(userId);
    if (state.state !== 'checkpoint_required') {
      return res.status(409).json({ error: 'No checkpoint required' });
    }
    
    // Get the session and browser page
    const session = sessionManager.getSession(userId);
    if (!session || !session.browserPage) {
      return res.status(410).json({ error: 'Session or page not found' });
    }
    
    const page = session.browserPage;
    
    try {
      // Execute the action based on type
      if (type === 'click') {
        if (selector) {
          await page.click(selector, { timeout: 10000 });
        } else if (x != null && y != null) {
          // Convert image coordinates to page coordinates
          // This is a simplified approach - in practice you might need more sophisticated coordinate mapping
          await page.mouse.click(x, y);
        }
      } else if (type === 'type') {
        if (selector) {
          await page.fill(selector, '');
          await page.type(selector, text || '', { delay: 25 });
        }
      } else if (type === 'press') {
        await page.keyboard.press(key || 'Enter');
      } else if (type === 'wait') {
        // Just wait for the page to settle
        await page.waitForTimeout(1000);
      }
      
      // Let the DOM settle
      await page.waitForTimeout(400);
      
      // Check if checkpoint is cleared
      const currentUrl = page.url();
      if (!currentUrl.includes('/checkpoint/')) {
        console.log('✅ Checkpoint completed, resuming session');
        setState(userId, { state: 'running' });
        
        // Resume the session flow
        if (session.resumeAfterCheckpoint) {
          session.resumeAfterCheckpoint();
        }
      }
      
      res.json({ ok: true, currentUrl });
    } catch (actionError) {
      console.error('Error executing checkpoint action:', actionError);
      res.status(400).json({ 
        ok: false, 
        error: actionError.message 
      });
    }
  } catch (error) {
    console.error('Error in checkpoint action endpoint:', error);
    res.status(500).json({ error: 'Failed to execute action' });
  }
});

/**
 * Clear checkpoint state (for manual completion)
 * POST /api/checkpoint/:userId/complete
 */
router.post('/:userId/complete', (req, res) => {
  try {
    const { userId } = req.params;
    
    const state = getState(userId);
    
    // If checkpoint is already completed or not required, that's fine - just return success
    if (state.state !== 'checkpoint_required') {
      console.log(`[CheckpointComplete] Checkpoint already completed or not required for user ${userId}, state: ${state.state}`);
      return res.json({ ok: true, message: 'Checkpoint already completed' });
    }
    
    // Clear the checkpoint state and resume
    clearState(userId);
    
    // Get session and resume if possible
    const session = sessionManager.getSession(userId);
    if (session && session.resumeAfterCheckpoint) {
      session.resumeAfterCheckpoint();
    }
    
    res.json({ ok: true, message: 'Checkpoint completed' });
  } catch (error) {
    console.error('Error completing checkpoint:', error);
    res.status(500).json({ error: 'Failed to complete checkpoint' });
  }
});

module.exports = router;
