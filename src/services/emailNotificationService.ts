import { supabase } from '../supabaseClient';

export interface JobMatchNotification {
  user_id: string;
  job_title: string;
  company: string;
  location: string;
  job_url?: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

class EmailNotificationService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  }

  /**
   * Send a job match notification email
   */
  async sendJobMatchNotification(payload: JobMatchNotification): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('job-match-notification', {
        body: payload
      });

      if (error) {
        console.error('Error sending job match notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Error calling job match notification function:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send a generic email notification
   */
  async sendEmailNotification(payload: EmailNotification): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload
      });

      if (error) {
        console.error('Error sending email notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Error calling send email function:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send application update notification
   */
  async sendApplicationUpdateNotification(
    userId: string,
    jobTitle: string,
    company: string,
    status: string
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Get user email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, notification_settings')
        .eq('id', userId)
        .single();

      if (!profile?.email) {
        return { success: false, error: 'User email not found' };
      }

      // Check if application updates are enabled
      const notificationSettings = profile.notification_settings || {};
      if (!notificationSettings.applicationUpdates) {
        return { success: true, id: 'notifications_disabled' };
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Update</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .status-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Application Update</h1>
              <p>Your job application status has been updated</p>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>Your application status has been updated:</p>
              
              <div class="status-card">
                <h3>${jobTitle}</h3>
                <p><strong>Company:</strong> ${company}</p>
                <p><strong>Status:</strong> ${status}</p>
              </div>
              
              <a href="https://app.kandujobs.com/applications" class="cta-button">View All Applications</a>
              
              <div class="footer">
                <p>You're receiving this because you have application updates enabled.</p>
                <p>To manage your notification preferences, visit your account settings.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmailNotification({
        to: profile.email,
        subject: `📋 Application Update: ${jobTitle} at ${company}`,
        html: emailHtml
      });
    } catch (error) {
      console.error('Error sending application update notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummary(userId: string): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Get user profile and check if weekly summary is enabled
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, notification_settings')
        .eq('id', userId)
        .single();

      if (!profile?.email) {
        return { success: false, error: 'User email not found' };
      }

      const notificationSettings = profile.notification_settings || {};
      if (!notificationSettings.weeklySummary) {
        return { success: true, id: 'notifications_disabled' };
      }

      // Get weekly stats
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: applications } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', userId)
        .gte('applied_at', oneWeekAgo.toISOString());

      const { data: savedJobs } = await supabase
        .from('job_swipes')
        .select('*')
        .eq('user_id', userId)
        .eq('swipe_direction', 'right')
        .gte('swiped_at', oneWeekAgo.toISOString());

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Job Search Summary</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; }
            .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Summary</h1>
              <p>Your job search activity this week</p>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p>Here's a summary of your job search activity over the past week:</p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${applications?.length || 0}</div>
                  <div>Applications</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${savedJobs?.length || 0}</div>
                  <div>Jobs Saved</div>
                </div>
              </div>
              
              <a href="https://app.kandujobs.com/dashboard" class="cta-button">View Dashboard</a>
              
              <div class="footer">
                <p>You're receiving this because you have weekly summaries enabled.</p>
                <p>To manage your notification preferences, visit your account settings.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmailNotification({
        to: profile.email,
        subject: '📊 Your Weekly Job Search Summary',
        html: emailHtml
      });
    } catch (error) {
      console.error('Error sending weekly summary:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const emailNotificationService = new EmailNotificationService();
