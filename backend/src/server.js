const app = require('./app');
const { createServer } = require('http');
const WebSocket = require('ws');
const { setupWebSocket } = require('./config/websocket');

// Load environment variables (.env then .env.local so .env.local overrides)
const path = require('path');
const root = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env') });
require('dotenv').config({ path: path.join(root, '.env.local') });

const PORT = process.env.PORT || 3001;

console.log('🔧 Starting server initialization...');
console.log(`📁 Current directory: ${__dirname}`);
console.log(`🔑 PORT environment: ${process.env.PORT}`);
console.log(`🔑 NODE_ENV: ${process.env.NODE_ENV}`);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Setup WebSocket
setupWebSocket(wss);

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
