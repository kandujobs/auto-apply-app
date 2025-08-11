const WebSocket = require('ws');

// Test WebSocket connection and completion messages
async function testWebSocketCompletion() {
  console.log('🧪 Testing WebSocket completion messages...');
  
  const ws = new WebSocket('ws://localhost:3002');
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected');
    
    // Send session connect message
    ws.send(JSON.stringify({
      type: 'session_connect',
      userId: 'test-user-123'
    }));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📤 Received message:', message);
      
      if (message.type === 'session_connected') {
        console.log('✅ Session connected successfully');
        
        // Simulate application completion by sending a message to the backend
        // This would normally come from the worker process
        setTimeout(() => {
          console.log('🎉 Simulating application completion...');
          // The backend should detect this and send a completion message
        }, 1000);
      } else if (message.type === 'application_completed') {
        console.log('✅ Application completion message received!');
        console.log('📊 Completion data:', message.data);
        ws.close();
      } else if (message.type === 'application_error') {
        console.log('❌ Application error message received!');
        console.log('📊 Error data:', message.data);
        ws.close();
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket closed');
  });
}

// Run the test
testWebSocketCompletion().catch(console.error); 