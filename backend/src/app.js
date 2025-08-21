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

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['https://app.kandujobs.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(helmet());

// Simple health check (always available)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
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
