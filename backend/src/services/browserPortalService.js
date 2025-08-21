const { broadcastToUser } = require('../config/websocket');

class BrowserPortalService {
  constructor() {
    this.activePortals = new Map(); // userId -> portalData
    this.screenshotInterval = null;
  }

  // Start browser portal for a user
  async startPortal(userId, page) {
    try {
      console.log(`🖥️ Starting browser portal for user: ${userId}`);
      
      const portalData = {
        userId,
        page,
        isActive: true,
        lastScreenshot: null,
        screenshotInterval: null
      };
      
      this.activePortals.set(userId, portalData);
      
      // Start screenshot streaming
      await this.startScreenshotStream(userId, page);
      
      // Notify frontend that portal is ready
      broadcastToUser(userId, {
        type: 'browser_portal_ready',
        message: 'Browser portal is ready for interaction'
      });
      
      return { success: true, message: 'Browser portal started' };
    } catch (error) {
      console.error('Error starting browser portal:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop browser portal for a user
  async stopPortal(userId) {
    try {
      console.log(`🖥️ Stopping browser portal for user: ${userId}`);
      
      const portalData = this.activePortals.get(userId);
      if (portalData) {
        // Clear screenshot interval
        if (portalData.screenshotInterval) {
          clearInterval(portalData.screenshotInterval);
        }
        
        portalData.isActive = false;
        this.activePortals.delete(userId);
        
        // Notify frontend that portal is closed
        broadcastToUser(userId, {
          type: 'browser_portal_closed',
          message: 'Browser portal closed'
        });
      }
      
      return { success: true, message: 'Browser portal stopped' };
    } catch (error) {
      console.error('Error stopping browser portal:', error);
      return { success: false, error: error.message };
    }
  }

  // Start screenshot streaming
  async startScreenshotStream(userId, page) {
    const portalData = this.activePortals.get(userId);
    if (!portalData) return;

    // Take initial screenshot
    await this.takeAndSendScreenshot(userId, page);

    // Set up interval for continuous screenshots
    portalData.screenshotInterval = setInterval(async () => {
      if (portalData.isActive) {
        await this.takeAndSendScreenshot(userId, page);
      }
    }, 1000); // Screenshot every second
  }

  // Take screenshot and send to frontend
  async takeAndSendScreenshot(userId, page) {
    try {
      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: 80,
        fullPage: false
      });
      
      const base64Screenshot = screenshot.toString('base64');
      
      // Send screenshot to frontend
      broadcastToUser(userId, {
        type: 'browser_screenshot',
        screenshot: base64Screenshot,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
  }

  // Handle click event from frontend
  async handleClick(userId, x, y) {
    try {
      const portalData = this.activePortals.get(userId);
      if (!portalData || !portalData.isActive) {
        throw new Error('Portal not active');
      }

      console.log(`🖱️ Handling click at (${x}, ${y}) for user: ${userId}`);
      
      // Click at the specified coordinates
      await portalData.page.mouse.click(x, y);
      
      // Send confirmation to frontend
      broadcastToUser(userId, {
        type: 'click_confirmed',
        x,
        y,
        timestamp: Date.now()
      });
      
      return { success: true, message: 'Click executed' };
    } catch (error) {
      console.error('Error handling click:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle input event from frontend
  async handleInput(userId, selector, value) {
    try {
      const portalData = this.activePortals.get(userId);
      if (!portalData || !portalData.isActive) {
        throw new Error('Portal not active');
      }

      console.log(`⌨️ Handling input for selector "${selector}" with value "${value}" for user: ${userId}`);
      
      // Fill the input field
      await portalData.page.fill(selector, value);
      
      // Send confirmation to frontend
      broadcastToUser(userId, {
        type: 'input_confirmed',
        selector,
        value: value ? '***' : '', // Don't send actual value for security
        timestamp: Date.now()
      });
      
      return { success: true, message: 'Input executed' };
    } catch (error) {
      console.error('Error handling input:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle key press event from frontend
  async handleKeyPress(userId, key) {
    try {
      const portalData = this.activePortals.get(userId);
      if (!portalData || !portalData.isActive) {
        throw new Error('Portal not active');
      }

      console.log(`⌨️ Handling key press "${key}" for user: ${userId}`);
      
      // Press the key
      await portalData.page.keyboard.press(key);
      
      // Send confirmation to frontend
      broadcastToUser(userId, {
        type: 'keypress_confirmed',
        key,
        timestamp: Date.now()
      });
      
      return { success: true, message: 'Key press executed' };
    } catch (error) {
      console.error('Error handling key press:', error);
      return { success: false, error: error.message };
    }
  }

  // Get portal status
  getPortalStatus(userId) {
    const portalData = this.activePortals.get(userId);
    return {
      isActive: !!portalData && portalData.isActive,
      hasPortal: !!portalData
    };
  }

  // Check if portal is active for user
  isPortalActive(userId) {
    const portalData = this.activePortals.get(userId);
    return !!portalData && portalData.isActive;
  }
}

// Create singleton instance
const browserPortalService = new BrowserPortalService();

module.exports = { browserPortalService };
