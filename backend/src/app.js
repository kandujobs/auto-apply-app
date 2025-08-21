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
const errorHandler = require('./middlewares/errorHandler');
const paymentMiddleware = require('./middlewares/paymentMiddleware');

// Import checkpoint portal
const { registerCheckpointPortal } = require('./services/checkpointPortal');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['https://app.kandujobs.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(helmet());

// Register checkpoint portal (must be after express.json())
registerCheckpointPortal(app);

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
