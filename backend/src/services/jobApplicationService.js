const { supabase } = require('../config/database');
const { broadcastToUser } = require('../config/websocket');

// Import the proven form filling logic
const { fillEasyApplyForm } = require('./test-simple-click.js');
console.log('✅ Successfully imported fillEasyApplyForm from test-simple-click.js');

class JobApplicationService {
  constructor() {
    this.BASE_DAILY_LIMIT = 15;
    this.REWARD_BONUSES = [2, 2, 3, 4, 5, 5, 10]; // Day 1-7 rewards
    this.applicationInProgress = new Map(); // userId -> boolean
  }

  /**
   * Main application function - extracted from old-server.js
   * @param {string} userId - User ID
   * @param {string} jobUrl - LinkedIn job URL
   * @param {string} jobTitle - Job title
   * @param {string} company - Company name
   * @returns {Promise<Object>} Application result
   */
  async applyToJob(userId, jobUrl, jobTitle, company) {
    try {
      console.log(`🚀 Starting job application for user: ${userId}`);
      console.log(`📝 Job: ${jobTitle} at ${company}`);
      console.log(`🔗 URL: ${jobUrl}`);
      
      if (this.applicationInProgress.get(userId)) {
        throw new Error('Another application is already in progress');
      }

      this.applicationInProgress.set(userId, true);

      try {
        // 1. Check daily limit with reward system
        await this.checkDailyLimit(userId);
        
        // 2. Process job URL
        const processedJobUrl = this.processJobUrl(jobUrl);
        
        // 3. Get user session
        const { sessionManager } = require('./sessionManager');
        const session = sessionManager.getSession(userId);
        
        if (!session || !session.isBrowserRunning || !session.browserPage) {
          throw new Error('No active browser session found. Please start a session first.');
        }

        // 4. Apply with browser using proven logic
        const result = await this.applyWithBrowser(session, processedJobUrl, jobTitle, company);
        
        // 5. Store application and update daily count
        await this.storeApplication(userId, processedJobUrl, jobTitle, company, result.status, result.errorMessage);
        
        if (result.status === 'applied') {
          await this.updateDailyApplicationCount(userId);
        }
        
        return {
          success: true,
          status: result.status,
          message: result.message,
          jobUrl: processedJobUrl,
          jobTitle,
          company
        };

      } finally {
        this.applicationInProgress.set(userId, false);
      }

    } catch (error) {
      console.error('Error in applyToJob:', error);
      this.applicationInProgress.set(userId, false);
      
      // Store failed application
      try {
        await this.storeApplication(userId, jobUrl, jobTitle, company, 'failed', error.message);
      } catch (storeError) {
        console.error('Error storing failed application:', storeError);
      }
      
      throw error;
    }
  }

  /**
   * Check daily limit with reward bonus system - from old-server.js
   * @param {string} userId - User ID
   * @throws {Error} If daily limit reached
   */
  async checkDailyLimit(userId) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      // Get today's tracking record
      const { data: trackingRecord, error: trackingError } = await supabase
        .from('user_daily_tracking')
        .select('auto_applies_used_today, login_streak, last_reward_claimed_date, reward_bonus_claimed')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      if (trackingError && trackingError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching daily tracking record:', trackingError);
        throw new Error('Failed to check application limit');
      }

      const currentUsage = trackingRecord?.auto_applies_used_today || 0;
      const loginStreak = trackingRecord?.login_streak || 0;
      const lastRewardClaimed = trackingRecord?.last_reward_claimed_date;
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
      broadcastToUser(userId, {
        type: 'daily_limit_check',
        message: `Daily limit check passed: ${currentUsage}/${totalDailyLimit} applications today`,
        applicationsToday: currentUsage,
        dailyLimit: totalDailyLimit,
        rewardBonus: rewardBonus
      });

    } catch (error) {
      console.error('Error in checkDailyLimit:', error);
      throw error;
    }
  }

  /**
   * Process job URL - from old-server.js
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

  /**
   * Apply with browser using proven logic - from old-server.js
   * @param {Object} session - User session with browser page
   * @param {string} jobUrl - LinkedIn job URL
   * @param {string} jobTitle - Job title
   * @param {string} company - Company name
   * @returns {Promise<Object>} Application result
   */
  async applyWithBrowser(session, jobUrl, jobTitle, company) {
    const page = session.browserPage;
    const userId = session.userId;

    try {
      console.log(`🌐 Navigating to job page: ${jobUrl}`);
      broadcastToUser(userId, {
        type: 'application_progress',
        message: 'Navigating to job page...',
        step: 'navigation'
      });

      // Navigate to job page
      await page.goto(jobUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
      console.log('✅ Navigation completed');

      // Wait for page to load
      await page.waitForTimeout(3000);

      // Scroll down slowly like a human
      console.log('🔄 Scrolling down like a human...');
      await page.evaluate(() => {
        window.scrollTo({
          top: window.scrollY + 200,
          behavior: 'smooth'
        });
      });
      await page.waitForTimeout(2000);

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
        broadcastToUser(userId, {
          type: 'application_progress',
          message: '❌ Job is no longer accepting applications',
          step: 'job_closed'
        });
        return { 
          status: 'job_closed', 
          message: 'Job is no longer accepting applications' 
        };
      }

      // Look for Easy Apply button
      console.log('🔍 Looking for Easy Apply button...');
      broadcastToUser(userId, {
        type: 'application_progress',
        message: 'Looking for Easy Apply button...',
        step: 'find_button'
      });

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
        broadcastToUser(userId, {
          type: 'application_progress',
          message: 'Clicking Easy Apply button...',
          step: 'click_button'
        });
        
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
            broadcastToUser(userId, {
              type: 'application_progress',
              message: 'Filling out Easy Apply form...',
              step: 'fill_form'
            });
            
            // Use the proven form filling logic from test-simple-click.js
            try {
              console.log('📝 Using proven form filling logic from test-simple-click.js');
              const formResult = await fillEasyApplyForm(page);
              
              if (formResult === true) {
                console.log('✅ Easy Apply form filled successfully using proven logic');
                broadcastToUser(userId, {
                  type: 'application_progress',
                  message: '✅ Application completed successfully!',
                  step: 'completed'
                });
                return { 
                  status: 'applied', 
                  message: 'Application completed successfully' 
                };
              } else {
                console.log('❌ Easy Apply form filling failed');
                broadcastToUser(userId, {
                  type: 'application_progress',
                  message: '❌ Form filling failed',
                  step: 'form_failed'
                });
                return { 
                  status: 'form_failed', 
                  message: 'Form filling failed' 
                };
              }
            } catch (error) {
              console.log(`❌ Error during form filling: ${error}`);
              broadcastToUser(userId, {
                type: 'application_progress',
                message: `❌ Form filling error: ${error.message}`,
                step: 'form_error'
              });
              return { 
                status: 'form_error', 
                message: `Form filling error: ${error.message}`,
                errorMessage: error.message
              };
            }
          } else {
            console.log('❌ Easy Apply modal not found after click');
            broadcastToUser(userId, {
              type: 'application_progress',
              message: '❌ Easy Apply modal not found',
              step: 'modal_not_found'
            });
            return { 
              status: 'modal_not_found', 
              message: 'Easy Apply modal not found after clicking button' 
            };
          }
        } else {
          console.log('❌ Could not get bounding box for button');
          return { 
            status: 'button_error', 
            message: 'Could not get button position' 
          };
        }
      } else {
        console.log('❌ No Easy Apply button found with any selector');
        broadcastToUser(userId, {
          type: 'application_progress',
          message: '❌ No Easy Apply button found',
          step: 'no_button'
        });
        return { 
          status: 'no_easy_apply', 
          message: 'No Easy Apply button found on this job' 
        };
      }

    } catch (error) {
      console.error('Error in applyWithBrowser:', error);
      broadcastToUser(userId, {
        type: 'application_progress',
        message: `❌ Application error: ${error.message}`,
        step: 'error'
      });
      return { 
        status: 'error', 
        message: `Application error: ${error.message}`,
        errorMessage: error.message
      };
    }
  }

  /**
   * Store application in database
   * @param {string} userId - User ID
   * @param {string} jobUrl - Job URL
   * @param {string} jobTitle - Job title
   * @param {string} company - Company name
   * @param {string} status - Application status
   * @param {string} errorMessage - Error message if any
   */
  async storeApplication(userId, jobUrl, jobTitle, company, status, errorMessage = null) {
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          user_id: userId,
          job_url: jobUrl,
          job_title: jobTitle || 'Unknown',
          company: company || 'Unknown',
          status: status,
          error_message: errorMessage,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing job application:', error);
        throw new Error('Failed to store job application');
      }

      console.log(`✅ Application stored: ${status} for ${jobTitle} at ${company}`);
    } catch (error) {
      console.error('Error in storeApplication:', error);
      throw error;
    }
  }

  /**
   * Update daily application count - from old-server.js
   * @param {string} userId - User ID
   */
  async updateDailyApplicationCount(userId) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      // Get or create today's tracking record
      const { data: existingRecord, error: fetchError } = await supabase
        .from('user_daily_tracking')
        .select('auto_applies_used_today')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Error fetching daily tracking record:', fetchError);
        return;
      }
      
      const currentUsage = existingRecord?.auto_applies_used_today || 0;
      const newUsage = currentUsage + 1;
      
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_daily_tracking')
          .update({ 
            auto_applies_used_today: newUsage,
            auto_apply_usage_date: today
          })
          .eq('user_id', userId)
          .eq('date', today);
        
        if (updateError) {
          console.error('❌ Error updating daily tracking record:', updateError);
          return;
        }
      } else {
        // Create new record for today
        const { error: insertError } = await supabase
          .from('user_daily_tracking')
          .insert({
            user_id: userId,
            date: today,
            auto_applies_used_today: newUsage,
            auto_apply_usage_date: today
          });
        
        if (insertError) {
          console.error('❌ Error creating daily tracking record:', insertError);
          return;
        }
      }
      
      console.log(`✅ Updated daily application count for user ${userId}: ${newUsage}`);
      
      // Send WebSocket update
      broadcastToUser(userId, {
        type: 'application_count_updated',
        message: `Daily application count updated: ${newUsage}`,
        applicationsToday: newUsage
      });
    } catch (error) {
      console.error('❌ Error updating daily application count:', error);
    }
  }

  /**
   * Check if application is in progress for user
   * @param {string} userId - User ID
   * @returns {boolean} True if application in progress
   */
  isApplicationInProgress(userId) {
    return this.applicationInProgress.get(userId) || false;
  }

  /**
   * Get application status for user
   * @param {string} userId - User ID
   * @returns {Object} Application status
   */
  getApplicationStatus(userId) {
    return {
      inProgress: this.isApplicationInProgress(userId),
      dailyLimit: this.BASE_DAILY_LIMIT,
      rewardBonuses: this.REWARD_BONUSES
    };
  }

}

// Create singleton instance
const jobApplicationService = new JobApplicationService();

module.exports = { jobApplicationService };
