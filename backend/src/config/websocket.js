const { sessionManager } = require('../services/sessionManager');

let connectedClients = new Set();

function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket client connected');
    
    // Limit the number of connections to prevent spam
    if (connectedClients.size >= 10) {
      console.log('🔌 Too many connections, closing new connection');
      ws.close();
      return;
    }
    
    connectedClients.add(ws);
    console.log(`🔌 Total connected clients: ${connectedClients.size}`);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('📤 Received WebSocket message:', data);
        
        if (data.type === 'session_connect') {
          // Client is connecting to a session
          const { userId } = data;
          console.log(`🔐 Client connecting to session for user: ${userId}`);
          
          // Set the userId on the WebSocket connection
          ws.userId = userId;
          console.log(`✅ WebSocket connection registered for user: ${userId}`);
          
          // Check if session exists
          let session;
          try {
            session = sessionManager.getSession(userId);
          } catch (error) {
            console.error("Error getting session:", error);
            session = null;
          }
          if (session) {
            // Session exists, link it to the WebSocket
            session.websocket = ws;
            session.lastActivity = Date.now();
            console.log(`✅ Client connected to existing session for user: ${userId}`);
            
            // Send session status to confirm connection
            ws.send(JSON.stringify({
              type: 'session_status',
              status: session.isActive ? 'active' : 'inactive',
              isBrowserRunning: session.isBrowserRunning,
              applicationProgress: session.applicationProgress,
              currentQuestion: session.currentQuestion,
              totalQuestions: session.totalQuestions
            }));
            
            console.log(`✅ Session status sent to client for user: ${userId}`);
          } else {
            // Session doesn't exist yet, but WebSocket is registered
            // The session will be created later and will link to this WebSocket
            console.log(`⏳ Session not found yet for user: ${userId}, WebSocket registered for future session`);
            
            // Send a waiting status
            ws.send(JSON.stringify({
              type: 'session_status',
              status: 'waiting',
              message: 'Waiting for session to be created'
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      connectedClients.delete(ws);
      
      if (ws.userId) {
        console.log(`🔌 Client disconnected from session for user: ${ws.userId}`);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      connectedClients.delete(ws);
    });
  });
}

function broadcastToUser(userId, message) {
  console.log(`📡 Broadcasting to user ${userId}:`, message);
  console.log(`📡 Connected clients: ${connectedClients.size}`);
  
  let sentCount = 0;
  connectedClients.forEach(client => {
    console.log(`📡 Checking client: userId=${client.userId}, readyState=${client.readyState}`);
    if (client.userId === userId && client.readyState === 1) {
      console.log(`📡 Sending message to client for user ${userId}`);
      client.send(JSON.stringify(message));
      sentCount++;
    }
  });
  
  console.log(`📡 Message sent to ${sentCount} clients for user ${userId}`);
}

function broadcastToAll(message) {
  connectedClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

module.exports = {
  setupWebSocket,
  broadcastToUser,
  broadcastToAll,
  connectedClients
};
