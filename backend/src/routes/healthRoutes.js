const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test connectivity endpoint
router.get('/test-connectivity', (req, res) => {
  res.json({
    message: 'Backend connectivity test successful',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
