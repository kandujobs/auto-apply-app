# 📧 Email Notifications Setup Guide

This guide will walk you through setting up a complete email notification system for KanduJobs using Resend and Supabase Edge Functions.

## 🚀 **Step 1: Resend Setup (YOU DO THIS)**

### 1.1 Sign up for Resend
1. Go to https://resend.com
2. Click "Get Started" and create an account
3. Verify your email address

### 1.2 Get Your API Key
1. In your Resend dashboard, go to "API Keys" in the sidebar
2. Click "Create API Key"
3. Give it a name like "KanduJobs Notifications"
4. Copy the API key (starts with `re_`)

### 1.3 Set Up Your Domain
1. Go to "Domains" in Resend
2. Click "Add Domain"
3. Add your domain (e.g., `kandujobs.com`)
4. Follow the DNS setup instructions
5. **OR** use the test domain `onboarding@resend.dev` for testing

## 🔧 **Step 2: Supabase Edge Functions Setup (YOU DO THIS)**

### 2.1 Install Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Or use npx
npx supabase --version
```

### 2.2 Login to Supabase
```bash
supabase login
```

### 2.3 Link Your Project
```bash
# Get your project reference from Supabase dashboard
supabase link --project-ref YOUR_PROJECT_REF
```

### 2.4 Set Environment Variables
```bash
# Set your Resend API key
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Set your Supabase service role key (get this from your Supabase dashboard)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2.5 Deploy Edge Functions
```bash
# Deploy all edge functions
supabase functions deploy

# Or deploy specific functions
supabase functions deploy send-email
supabase functions deploy job-match-notification
```

## 🗄️ **Step 3: Database Setup (YOU DO THIS)**

### 3.1 Run SQL Migrations
Run these SQL files in your Supabase SQL editor:

1. **Add updated_at column to profiles:**
   ```sql
   -- Run the contents of add_updated_at_to_profiles.sql
   ```

2. **Create email notifications table:**
   ```sql
   -- Run the contents of email_notifications_schema.sql
   ```

3. **Add notification settings to profiles:**
   ```sql
   -- Run the contents of add_notification_privacy_settings.sql
   ```

## 🎯 **Step 4: Test the System**

### 4.1 Test Job Match Notification
```javascript
// In your browser console or test file
const { emailNotificationService } = await import('./src/services/emailNotificationService.ts');

// Test job match notification
const result = await emailNotificationService.sendJobMatchNotification({
  user_id: 'your-user-id',
  job_title: 'Software Engineer',
  company: 'Tech Corp',
  location: 'San Francisco, CA',
  job_url: 'https://example.com/job'
});

console.log(result);
```

### 4.2 Test Application Update Notification
```javascript
// Test application update
const result = await emailNotificationService.sendApplicationUpdateNotification(
  'your-user-id',
  'Software Engineer',
  'Tech Corp',
  'Under Review'
);
```

## 📋 **Step 5: Integration Points**

### 5.1 Job Match Notifications
When a user swipes right on a job, call:
```javascript
import { emailNotificationService } from './src/services/emailNotificationService';

// In your swipe handler
if (swipeDirection === 'right') {
  await emailNotificationService.sendJobMatchNotification({
    user_id: currentUser.id,
    job_title: job.title,
    company: job.company,
    location: job.location,
    job_url: job.url
  });
}
```

### 5.2 Application Status Updates
When an application status changes:
```javascript
// In your application update handler
await emailNotificationService.sendApplicationUpdateNotification(
  userId,
  jobTitle,
  company,
  newStatus
);
```

### 5.3 Weekly Summaries
Set up a cron job or scheduled function to send weekly summaries:
```javascript
// Weekly summary (run this once per week)
const users = await supabase.from('profiles').select('id');
for (const user of users) {
  await emailNotificationService.sendWeeklySummary(user.id);
}
```

## 🔍 **Step 6: Monitoring & Debugging**

### 6.1 Check Email Logs
- Go to your Resend dashboard
- Check "Logs" to see sent emails
- Check "Analytics" for delivery rates

### 6.2 Check Supabase Logs
- Go to your Supabase dashboard
- Check "Edge Functions" > "Logs"
- Look for any errors in the function execution

### 6.3 Check Database
```sql
-- Check email notifications table
SELECT * FROM email_notifications ORDER BY sent_at DESC LIMIT 10;

-- Check user notification settings
SELECT id, email, notification_settings FROM profiles LIMIT 5;
```

## 🛠️ **Troubleshooting**

### Common Issues:

1. **"RESEND_API_KEY not configured"**
   - Make sure you set the secret: `supabase secrets set RESEND_API_KEY=your_key`

2. **"User profile not found"**
   - Ensure the user exists in the profiles table
   - Check that the user_id is correct

3. **"Job match notifications disabled"**
   - User has disabled notifications in their settings
   - Check notification_settings.jobMatchNotifications

4. **Edge function not found**
   - Make sure you deployed the functions: `supabase functions deploy`
   - Check the function name matches exactly

5. **CORS errors**
   - Edge functions include CORS headers
   - Make sure you're calling from the correct domain

## 📊 **Email Templates**

The system includes beautiful, responsive email templates for:
- 🎯 Job Match Notifications
- 📋 Application Updates  
- 📊 Weekly Summaries

All templates are mobile-friendly and include:
- Professional styling
- Clear call-to-action buttons
- Unsubscribe/notification management links
- KanduJobs branding

## 🔐 **Security Notes**

- API keys are stored as Supabase secrets
- Edge functions run in isolated environments
- User notification preferences are respected
- All emails include unsubscribe options
- Rate limiting is handled by Resend

## 📈 **Next Steps**

1. **Set up monitoring** - Monitor email delivery rates
2. **A/B testing** - Test different email templates
3. **Analytics** - Track email engagement
4. **Automation** - Set up more automated triggers
5. **Personalization** - Add user-specific content

---

**Need help?** Check the Supabase and Resend documentation, or look at the function logs for specific error messages.
