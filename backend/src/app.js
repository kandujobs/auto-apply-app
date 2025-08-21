const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const sessionRoutes = require('./routes/sessionRoutes');
const jobRoutes = require('./routes/jobRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const healthRoutes = require('./routes/healthRoutes');
const browserPortalRoutes = require('./routes/browserPortalRoutes');

// Import middleware
const { errorHandler } = require('./middlewares/errorHandler');
const { checkPaymentService } = require('./middlewares/paymentMiddleware');

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin} - User-Agent: ${req.headers['user-agent']?.substring(0, 50)}`);
  next();
});

// CORS configuration - MUST be first!
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',
    'X-Requested-With',
    'Origin',
    'Accept'
  ],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Other middleware
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP for now
}));

// Simple health check (always available)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for CORS debugging
app.get('/api/test-cors', (req, res) => {
  console.log('🧪 Test CORS endpoint called');
  console.log('🧪 Headers:', req.headers);
  res.json({
    message: 'CORS test successful',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method
  });
});

app.post('/api/test-cors', (req, res) => {
  console.log('🧪 Test CORS POST endpoint called');
  console.log('🧪 Headers:', req.headers);
  console.log('🧪 Body:', req.body);
  res.json({
    message: 'CORS POST test successful',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    method: req.method,
    body: req.body
  });
});

// Register checkpoint portal with error handling
try {
  const { registerCheckpointPortal } = require('./services/checkpointPortal');
  registerCheckpointPortal(app);
  console.log('✅ Checkpoint portal registered successfully');
} catch (error) {
  console.warn('⚠️ Failed to register checkpoint portal:', error.message);
  console.log('⚠️ Continuing without checkpoint portal functionality');
}

// Routes
app.use('/api/session', sessionRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', healthRoutes);
app.use('/api/browser-portal', browserPortalRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Auto-Apply Backend API' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
