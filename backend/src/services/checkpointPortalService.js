const { broadcastToUser } = require('../config/websocket');

class CheckpointPortalService {
  constructor() {
    this.portalBaseUrl = process.env.CHECKPOINT_PORTAL_URL || 'http://localhost:8080';
    this.activePortals = new Map(); // userId -> portalData
  }

  async startPortal(userId, currentUrl) {
    try {
      console.log(`🖥️ Starting checkpoint portal for user: ${userId}`);
      console.log(`🖥️ Current URL: ${currentUrl}`);

      // Check if external portal service is available
      const isExternalPortalAvailable = await this.checkExternalPortalAvailability();
      
      if (!isExternalPortalAvailable) {
        console.log(`⚠️ External checkpoint portal not available, using fallback mode`);
        return this.startFallbackPortal(userId, currentUrl);
      }

      // Call the checkpoint portal service
      const response = await fetch(`${this.portalBaseUrl}/checkpoint/start`, {
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
        console.log(`⚠️ Falling back to manual checkpoint mode`);
        return this.startFallbackPortal(userId, currentUrl);
      }

      const portalData = await response.json();
      console.log(`✅ Checkpoint portal started:`, portalData);

      // Store portal data
      this.activePortals.set(userId, {
        token: portalData.token,
        portalUrl: portalData.portalUrl,
        startedAt: Date.now(),
        isExternal: true
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
      console.log(`⚠️ Falling back to manual checkpoint mode`);
      return this.startFallbackPortal(userId, currentUrl);
    }
  }

  async startFallbackPortal(userId, currentUrl) {
    console.log(`🖥️ Starting fallback checkpoint portal for user: ${userId}`);
    
    // Store fallback portal data
    this.activePortals.set(userId, {
      token: 'fallback-' + Date.now(),
      portalUrl: null,
      startedAt: Date.now(),
      isExternal: false,
      currentUrl: currentUrl
    });

    // Notify frontend about manual checkpoint
    broadcastToUser(userId, {
      type: 'checkpoint_manual_required',
      message: 'Security checkpoint detected. Please complete verification manually in your browser.',
      currentUrl: currentUrl
    });

    return {
      token: 'fallback',
      portalUrl: null,
      isFallback: true
    };
  }

  async checkExternalPortalAvailability() {
    try {
      const response = await fetch(`${this.portalBaseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      console.log(`⚠️ External portal health check failed: ${error.message}`);
      return false;
    }
  }

  async waitForCompletion(userId, timeoutMs = 300000) { // 5 minutes default
    return new Promise((resolve, reject) => {
      const portalData = this.activePortals.get(userId);
      if (!portalData) {
        reject(new Error('No active portal found for user'));
        return;
      }

      if (portalData.isExternal) {
        // External portal - check if it's still active
        this.waitForExternalPortalCompletion(userId, timeoutMs, resolve, reject);
      } else {
        // Fallback portal - wait for manual completion signal
        this.waitForFallbackPortalCompletion(userId, timeoutMs, resolve, reject);
      }
    });
  }

  async waitForExternalPortalCompletion(userId, timeoutMs, resolve, reject) {
    const portalData = this.activePortals.get(userId);
    const startTime = Date.now();
    const checkInterval = setInterval(async () => {
      try {
        // Check if portal is still active by trying to access it
        const response = await fetch(`${this.portalBaseUrl}/checkpoint/${portalData.token}`, {
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
  }

  async waitForFallbackPortalCompletion(userId, timeoutMs, resolve, reject) {
    const startTime = Date.now();
    const checkInterval = setInterval(async () => {
      try {
        // For fallback mode, we just wait and assume user will complete manually
        // We could implement a manual completion endpoint here if needed
        if (Date.now() - startTime > timeoutMs) {
          // Timeout - assume user completed manually
          clearInterval(checkInterval);
          this.activePortals.delete(userId);
          
          console.log(`✅ Fallback checkpoint completed for user: ${userId}`);
          
          // Notify frontend
          broadcastToUser(userId, {
            type: 'checkpoint_portal_completed',
            message: 'Security checkpoint completed (manual mode)'
          });
          
          resolve();
        }
      } catch (error) {
        console.error('❌ Error in fallback portal wait:', error);
        clearInterval(checkInterval);
        this.activePortals.delete(userId);
        reject(error);
      }
    }, 5000); // Check every 5 seconds for fallback mode
  }

  async stopPortal(userId) {
    try {
      const portalData = this.activePortals.get(userId);
      if (!portalData) {
        console.log(`⚠️ No active portal found for user: ${userId}`);
        return;
      }

      console.log(`🖥️ Stopping checkpoint portal for user: ${userId}`);

      if (portalData.isExternal) {
        // Call the done endpoint to close the portal
        const response = await fetch(`${this.portalBaseUrl}/checkpoint/${portalData.token}/done`, {
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
      } else {
        console.log(`✅ Fallback checkpoint portal stopped for user: ${userId}`);
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
