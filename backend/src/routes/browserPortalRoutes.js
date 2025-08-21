const express = require('express');
const router = express.Router();
const { browserPortalService } = require('../services/browserPortalService');

// Handle click event from frontend
router.post('/click', async (req, res) => {
  try {
    const { userId, x, y } = req.body;
    
    if (!userId || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, x, y' });
    }

    const result = await browserPortalService.handleClick(userId, x, y);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error handling click:', error);
    res.status(500).json({ error: 'Failed to handle click' });
  }
});

// Handle input event from frontend
router.post('/input', async (req, res) => {
  try {
    const { userId, selector, value } = req.body;
    
    if (!userId || !selector) {
      return res.status(400).json({ error: 'Missing required fields: userId, selector' });
    }

    const result = await browserPortalService.handleInput(userId, selector, value);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error handling input:', error);
    res.status(500).json({ error: 'Failed to handle input' });
  }
});

// Handle key press event from frontend
router.post('/keypress', async (req, res) => {
  try {
    const { userId, key } = req.body;
    
    if (!userId || !key) {
      return res.status(400).json({ error: 'Missing required fields: userId, key' });
    }

    const result = await browserPortalService.handleKeyPress(userId, key);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error handling key press:', error);
    res.status(500).json({ error: 'Failed to handle key press' });
  }
});

// Get portal status
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    const status = browserPortalService.getPortalStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Error getting portal status:', error);
    res.status(500).json({ error: 'Failed to get portal status' });
  }
});

// Stop portal
router.post('/stop', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    const result = await browserPortalService.stopPortal(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error stopping portal:', error);
    res.status(500).json({ error: 'Failed to stop portal' });
  }
});

module.exports = router;
