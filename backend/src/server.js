const { app, wss, PORT } = require('./app');
const { createServer } = require('http');
const { setupWebSocket } = require('./config/websocket');

// Load environment variables
try {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
} catch (error) {
  console.log('No .env file found, using environment variables');
}

// Set Supabase environment variables for imported modules
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://xipjxcktpzanmhfrkbrm.supabase.co';
process.env.SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE';

console.log('🔧 Starting server initialization...');
console.log(`📁 Current directory: ${__dirname}`);
console.log(`🔑 PORT environment: ${process.env.PORT}`);
console.log(`🔑 NODE_ENV: ${process.env.NODE_ENV}`);

// Create HTTP server
const server = createServer(app);

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
