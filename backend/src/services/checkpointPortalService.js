const { broadcastToUser } = require('../config/websocket');

class CheckpointPortalService {
  constructor() {
    this.activePortals = new Map(); // userId -> portalData
  }

  async startPortal(userId, currentUrl) {
    try {
      console.log(`🖥️ Starting integrated checkpoint portal for user: ${userId}`);
      console.log(`🖥️ Current URL: ${currentUrl}`);

      // Call the integrated checkpoint portal endpoint
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}/checkpoint/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          url: currentUrl
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Failed to start checkpoint portal: ${error}`);
        throw new Error(`Failed to start checkpoint portal: ${error}`);
      }

      const portalData = await response.json();
      console.log(`✅ Checkpoint portal started:`, portalData);

      // Store portal data
      this.activePortals.set(userId, {
        token: portalData.token,
        portalUrl: portalData.portalUrl,
        startedAt: Date.now(),
        isExternal: false
      });

      // Notify frontend
      broadcastToUser(userId, {
        type: 'checkpoint_portal_ready',
        portalUrl: portalData.portalUrl,
        message: 'Security checkpoint portal is ready'
      });

      return portalData;
    } catch (error) {
      console.error('❌ Error starting checkpoint portal:', error);
      throw error;
    }
  }

  async waitForCompletion(userId, timeoutMs = 300000) { // 5 minutes default
    return new Promise((resolve, reject) => {
      const portalData = this.activePortals.get(userId);
      if (!portalData) {
        reject(new Error('No active portal found for user'));
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(async () => {
        try {
          // Check if portal is still active by trying to access it
          const response = await fetch(`http://localhost:${process.env.PORT || 3001}/checkpoint/${portalData.token}`, {
            headers: {
              'x-user-id': userId
            }
          });

          if (response.status === 404) {
            // Portal was closed (user clicked Done)
            clearInterval(checkInterval);
            this.activePortals.delete(userId);
            
            console.log(`✅ Checkpoint portal completed for user: ${userId}`);
            
            // Notify frontend
            broadcastToUser(userId, {
              type: 'checkpoint_portal_completed',
              message: 'Security checkpoint completed'
            });
            
            resolve();
          } else if (Date.now() - startTime > timeoutMs) {
            // Timeout
            clearInterval(checkInterval);
            this.activePortals.delete(userId);
            reject(new Error('Checkpoint portal timeout'));
          }
        } catch (error) {
          console.error('❌ Error checking portal status:', error);
          clearInterval(checkInterval);
          this.activePortals.delete(userId);
          reject(error);
        }
      }, 2000); // Check every 2 seconds
    });
  }

  async stopPortal(userId) {
    try {
      const portalData = this.activePortals.get(userId);
      if (!portalData) {
        console.log(`⚠️ No active portal found for user: ${userId}`);
        return;
      }

      console.log(`🖥️ Stopping checkpoint portal for user: ${userId}`);

      // Call the done endpoint to close the portal
      const response = await fetch(`http://localhost:${process.env.PORT || 3001}/checkpoint/${portalData.token}/done`, {
        method: 'POST',
        headers: {
          'x-user-id': userId
        }
      });

      if (response.ok) {
        console.log(`✅ Checkpoint portal stopped for user: ${userId}`);
      } else {
        console.warn(`⚠️ Failed to stop checkpoint portal: ${response.status}`);
      }

      this.activePortals.delete(userId);

      // Notify frontend
      broadcastToUser(userId, {
        type: 'checkpoint_portal_closed',
        message: 'Security checkpoint portal closed'
      });
    } catch (error) {
      console.error('❌ Error stopping checkpoint portal:', error);
      this.activePortals.delete(userId);
    }
  }

  isPortalActive(userId) {
    return this.activePortals.has(userId);
  }

  getPortalData(userId) {
    return this.activePortals.get(userId);
  }
}

const checkpointPortalService = new CheckpointPortalService();
module.exports = { checkpointPortalService };
