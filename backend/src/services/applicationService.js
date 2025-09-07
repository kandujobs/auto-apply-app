const { supabase } = require('../config/database');
const { broadcastToUser } = require('../config/websocket');
const { fillEasyApplyForm } = require('./test-simple-click.js');

class ApplicationService {
  constructor() {
    this.BASE_DAILY_LIMIT = 15;
    this.REWARD_BONUSES = [2, 2, 3, 4, 5, 5, 10]; // Day 1-7 rewards
  }

  /**
   * Process job application using existing session - extracted from old-server.js
   * @param {string} userId - User ID
   * @param {string} jobId - Job ID
   * @param {string} jobUrl - Job URL
   * @param {string} jobTitle - Job title
   * @param {string} company - Company name
   */
  async processJobWithExistingSession(userId, jobId, jobUrl, jobTitle, company) {
    try {
      console.log(`🔄 Processing job ${jobId} with existing session for user: ${userId}`);
      
      // Send initial progress
      this.sendProgressToSession(userId, '🚀 Starting job application...');
      
      // Get the session from sessionManager
      const { sessionManager } = require('./sessionManager');
      const session = sessionManager.getSession(userId);
      if (!session) {
        this.sendProgressToSession(userId, '❌ Session not found');
        throw new Error('Session not found');
      }
      
      // Send progress update
      this.sendProgressToSession(userId, '📄 Navigating to job page...');
      
      // Apply to job using existing browser
      const result = await this.applyToJobWithBrowser(session, jobId, jobUrl, jobTitle, company);
      
      if (result === true) {
        console.log(`✅ Job ${jobId} application completed successfully`);
        this.sendProgressToSession(userId, '✅ Application completed successfully!');
        
        // Store successful application
        await this.storeApplication(userId, jobUrl, jobTitle, company, 'applied');
        
        // Increment daily application limit
        await this.updateDailyApplicationCount(userId);
        
        // Send WebSocket message to notify frontend of completion
        broadcastToUser(userId, {
          type: 'application_completed',
          status: 'completed',
          message: 'Application completed successfully!'
        });
      } else {
        console.log(`❌ Job ${jobId} application failed`);
        this.sendProgressToSession(userId, '❌ Application failed - job may not be accepting applications');
        
        // Store failed application
        await this.storeApplication(userId, jobUrl, jobTitle, company, 'failed', 'Application failed');
        
        // Send WebSocket message to notify frontend of failure
        broadcastToUser(userId, {
          type: 'application_completed',
          status: 'error',
          message: 'Application failed - job may not be accepting applications'
        });
      }
      
    } catch (error) {
      console.error(`❌ Error in processJobWithExistingSession for job ${jobId}:`, error);
      this.sendProgressToSession(userId, `❌ Application error: ${error.message}`);
      
      // Store error application
      await this.storeApplication(userId, jobUrl, jobTitle, company, 'error', error.message);
      
      throw error;
    }
  }

  /**
   * Apply to job using existing browser instance - extracted from old-server.js
   * @param {Object} session - User session with browser page
   * @param {string} jobId - Job ID
   * @param {string} jobUrl - Job URL
   * @param {string} jobTitle - Job title
   * @param {string} company - Company name
   */
  async applyToJobWithBrowser(session, jobId, jobUrl, jobTitle, company) {
    try {
      console.log(`📝 Applying to job ${jobId} using existing browser...`);
      
      const page = session.browserPage;
      if (!page) {
        throw new Error('No browser page available in session');
      }
      
      // Navigate to job page
      console.log(`📄 Navigating to job page: ${jobUrl}`);
      await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('✅ Navigation completed');
      
      // Wait for page to load
      await page.waitForTimeout(8000);
      
      // Scroll down slowly
      console.log('🔄 Scrolling down like a human...');
      await page.evaluate(() => {
        window.scrollTo({
          top: window.scrollY + 200,
          behavior: 'smooth'
        });
      });
      
      await page.waitForTimeout(3000);
      
      // Check if job is no longer accepting applications
      console.log('🔍 Checking if job is still accepting applications...');
      const noLongerAcceptingSelectors = [
        'text="No longer accepting applications"',
        'text="Applications are no longer being accepted"',
        'text="This job is no longer accepting applications"',
        '[data-test-id="job-closed-banner"]',
        '.jobs-unified-top-card__job-closed-banner',
        '.jobs-unified-top-card__job-closed-message'
      ];
      
      let jobClosed = false;
      for (const selector of noLongerAcceptingSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            const text = await element.textContent();
            console.log(`❌ Job is no longer accepting applications: "${text}"`);
            jobClosed = true;
            break;
          }
        } catch (error) {
          // Element not found, continue
        }
      }
      
      if (jobClosed) {
        console.log('❌ Job is no longer accepting applications');
        this.sendProgressToSession(session.userId, '❌ Job is no longer accepting applications');
        return false;
      }
      
      // Look for Easy Apply button
      console.log('🔍 Looking for Easy Apply button...');
      
      const easyApplySelectors = [
        'button:has-text("Easy Apply")',
        'button:has-text("Apply")',
        '[data-control-name="jobdetails_topcard_inapply"]',
        '.jobs-apply-button',
        '.jobs-apply-button--top-card',
        'button[aria-label*="Apply"]',
        'button[aria-label*="Easy Apply"]'
      ];
      
      let easyApplyButton = null;
      
      for (const selector of easyApplySelectors) {
        try {
          const button = await page.locator(selector).first();
          if (await button.isVisible()) {
            easyApplyButton = button;
            console.log(`✅ Found Easy Apply button with selector: ${selector}`);
            break;
          }
        } catch (error) {
          console.log(`Button selector ${selector} failed: ${error}`);
        }
      }
      
      if (easyApplyButton) {
        console.log('🖱️ Clicking Easy Apply button...');
        
        // Get button position and click
        const boundingBox = await easyApplyButton.boundingBox();
        if (boundingBox) {
          await easyApplyButton.click();
          console.log('✅ Easy Apply button clicked');
          
          // Wait for modal or page change
          await page.waitForTimeout(3000);
          
          // Check for Easy Apply modal
          const modalSelectors = [
            '[data-test-modal-id="easy-apply-modal"]',
            '.jobs-easy-apply-modal',
            '[role="dialog"]',
            '.modal'
          ];
          
          let modalFound = false;
          for (const modalSelector of modalSelectors) {
            try {
              const modal = await page.locator(modalSelector).first();
              if (await modal.isVisible()) {
                console.log(`✅ Found Easy Apply modal with selector: ${modalSelector}`);
                modalFound = true;
                break;
              }
            } catch (error) {
              // Modal not found with this selector
            }
          }
          
          if (modalFound) {
            console.log('📝 Filling out Easy Apply form using proven test-simple-click.js logic...');
            this.sendProgressToSession(session.userId, '📝 Filling out Easy Apply form...');
            
            // Use the proven form filling logic from test-simple-click.js
            try {
              const formResult = await fillEasyApplyForm(page, session.userId);
              if (formResult === true) {
                console.log('✅ Easy Apply form filled successfully using proven logic');
                return true;
              } else {
                console.log('❌ Easy Apply form filling failed');
                return false;
              }
            } catch (error) {
              console.log(`❌ Error during form filling: ${error}`);
              return false;
            }
          } else {
            console.log('❌ Easy Apply modal not found after click');
            return false;
          }
        } else {
          console.log('❌ Could not get bounding box for button');
        }
      } else {
        console.log('❌ No Easy Apply button found with any selector');
      }
      
      console.log('❌ No Easy Apply button found or clickable');
      return false;
      
    } catch (error) {
      console.log(`❌ Error during job application: ${error}`);
      return false;
    }
  }

  /**
   * Send progress update to session - extracted from old-server.js
   * @param {string} userId - User ID
   * @param {string} progress - Progress message
   */
  sendProgressToSession(userId, progress) {
    // Use the existing broadcastToUser function with correct format for sessionService
    broadcastToUser(userId, {
      type: 'progress',
      data: progress  // sessionService expects data.data, not data.message
    });
    
    // Also update session progress if available
    const { sessionManager } = require('./sessionManager');
    const session = sessionManager.getSession(userId);
    if (session) {
      session.applicationProgress = progress;
      session.lastActivity = Date.now();
    }
    
    console.log(`📤 Progress sent to session ${userId}: ${progress}`);
  }

  /**
   * Store application in database - updates job_swipes table for LinkedIn jobs
   * @param {string} userId - User ID
   * @param {string} jobUrl - Job URL
   * @param {string} jobTitle - Job title
   * @param {string} company - Company name
   * @param {string} status - Application status
   * @param {string} errorMessage - Error message if any
   */
  async storeApplication(userId, jobUrl, jobTitle, company, status, errorMessage = null) {
    try {
      // Extract LinkedIn job ID from URL
      let linkedinJobId = null;
      if (jobUrl.includes('linkedin.com/jobs/view/')) {
        const match = jobUrl.match(/\/jobs\/view\/(\d+)/);
        if (match) {
          linkedinJobId = match[1];
        }
      } else if (jobUrl.includes('currentJobId=')) {
        const match = jobUrl.match(/currentJobId=(\d+)/);
        if (match) {
          linkedinJobId = match[1];
        }
      }

      // Find the UUID job_id from linkedin_fetched_jobs table
      let jobId = null;
      if (linkedinJobId) {
        const { data: fetchedJob, error: fetchError } = await supabase
          .from('linkedin_fetched_jobs')
          .select('id')
          .eq('linkedin_job_id', linkedinJobId)
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          console.error('Error finding LinkedIn job in database:', fetchError);
          // If we can't find the job, we can't update the swipe record
          console.log(`⚠️ LinkedIn job ${linkedinJobId} not found in database, skipping application storage`);
          return;
        }
        
        jobId = fetchedJob.id;
        console.log(`✅ Found job UUID: ${jobId} for LinkedIn job ID: ${linkedinJobId}`);
      } else {
        console.log('⚠️ Could not extract LinkedIn job ID from URL, skipping application storage');
        return;
      }

      // Update the job_swipes table with application results
      const updateData = {
        application_processed: true,
        application_processed_at: new Date().toISOString()
      };

      if (status === 'applied') {
        updateData.application_success = true;
        updateData.application_error = null;
      } else {
        updateData.application_success = false;
        updateData.application_error = errorMessage || 'Application failed';
      }

      const { error } = await supabase
        .from('job_swipes')
        .update(updateData)
        .eq('user_id', userId)
        .eq('job_id', jobId)
        .eq('swipe_direction', 'right'); // Only update right swipes (applied jobs)

      if (error) {
        console.error('Error updating job application in job_swipes:', error);
        throw new Error('Failed to store job application');
      }

      console.log(`✅ Application stored: ${status} for ${jobTitle} at ${company} (jobId: ${jobId})`);
    } catch (error) {
      console.error('Error in storeApplication:', error);
      throw error;
    }
  }

  /**
   * Update daily application count - extracted from old-server.js
   * @param {string} userId - User ID
   */
  async updateDailyApplicationCount(userId) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('auto_applies_used_today, auto_apply_usage_date')
        .eq('id', userId)
        .single();
      
      if (!profileError && profile) {
        const today = new Date().toISOString().slice(0, 10);
        const currentUsage = profile.auto_applies_used_today || 0;
        const newUsage = currentUsage + 1;
        
        await supabase
          .from('profiles')
          .update({ 
            auto_applies_used_today: newUsage,
            auto_apply_usage_date: today
          })
          .eq('id', userId);
        
        console.log(`✅ Updated daily application count for user ${userId}: ${newUsage}`);
      }
    } catch (error) {
      console.error('❌ Error updating daily application count:', error);
    }
  }

  /**
   * Check daily limit with reward bonus system - extracted from old-server.js
   * @param {string} userId - User ID
   * @throws {Error} If daily limit reached
   */
  async checkDailyLimit(userId) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('auto_applies_used_today, auto_apply_usage_date, login_streak, last_reward_claimed_date')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to check application limit');
      }

      const today = new Date().toISOString().slice(0, 10);
      const currentUsage = profile?.auto_applies_used_today || 0;
      const usageDate = profile?.auto_apply_usage_date;
      
      // Reset usage if it's a new day
      if (usageDate !== today) {
        await supabase
          .from('profiles')
          .update({ auto_applies_used_today: 0, auto_apply_usage_date: today })
          .eq('id', userId);
      }
      
      // Calculate daily reward bonus
      const loginStreak = profile?.login_streak || 0;
      const lastRewardClaimed = profile?.last_reward_claimed_date;
      let rewardBonus = 0;
      
      // Check if reward was claimed today
      if (lastRewardClaimed === today && loginStreak > 0) {
        // 7-day reward cycle with specific amounts
        const rewardIndex = ((loginStreak - 1) % 7 + 7) % 7;
        rewardBonus = this.REWARD_BONUSES[rewardIndex];
      }
      
      // Calculate total daily limit (base 15 + reward bonus)
      const totalDailyLimit = this.BASE_DAILY_LIMIT + rewardBonus;
      
      // Check if user has reached daily limit
      if (currentUsage >= totalDailyLimit) {
        throw new Error(`Daily application limit reached (${totalDailyLimit} applications). Please try again tomorrow.`);
      }

      console.log(`📊 Applications today: ${currentUsage}/${totalDailyLimit} (base: ${this.BASE_DAILY_LIMIT}, bonus: ${rewardBonus})`);

      // Send progress update
      this.sendProgressToSession(userId, `📊 Daily limit check passed: ${currentUsage}/${totalDailyLimit} applications today`);

    } catch (error) {
      console.error('Error in checkDailyLimit:', error);
      throw error;
    }
  }

  /**
   * Process job URL - extracted from old-server.js
   * @param {string} jobUrl - Original job URL
   * @returns {string} Processed job URL
   */
  processJobUrl(jobUrl) {
    // Convert search URL to proper job URL if needed
    if (jobUrl.includes('jobs/search') && jobUrl.includes('currentJobId=')) {
      const currentJobIdMatch = jobUrl.match(/currentJobId=(\d+)/);
      if (currentJobIdMatch) {
        const jobId = currentJobIdMatch[1];
        const processedUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;
        console.log('Converted search URL to job URL:', { original: jobUrl, converted: processedUrl });
        return processedUrl;
      }
    }
    return jobUrl;
  }
}

// Create singleton instance
const applicationService = new ApplicationService();

module.exports = { applicationService };
