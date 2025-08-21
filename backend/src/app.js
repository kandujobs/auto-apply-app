const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');

// Import routes
const jobRoutes = require('./routes/jobRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Import middleware
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Create WebSocket server on the same port as HTTP server
const wss = new WebSocket.Server({ noServer: true });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api', jobRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api', healthRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kandu Auto-Apply Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = { app, wss, PORT };
