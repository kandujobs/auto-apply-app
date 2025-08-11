const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (error) {
  console.log('No .env file found, using environment variables');
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    status: 'healthy'
  });
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
    services: {
      express: 'running',
      cors: 'enabled'
    }
  };
  
  res.json(healthStatus);
});

// Test connectivity endpoint
app.get('/api/test-connectivity', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is accessible',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      root: '/'
    }
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`🌐 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Supabase URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`🔑 CORS Origin: ${process.env.CORS_ORIGIN || 'Not set'}`);
});
