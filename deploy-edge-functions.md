# 🚀 Manual Edge Functions Deployment Guide

Since the Supabase CLI is having connection issues, let's deploy the edge functions manually through the Supabase dashboard.

## 📋 **Step 1: Set Environment Variables in Supabase Dashboard**

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard/project/xipjxcktpzanmhfrkbrm
2. **Navigate to Settings > Edge Functions**
3. **Click "Add Secret"** and add these secrets:

### Secret 1: RESEND_API_KEY
- **Name**: `RESEND_API_KEY`
- **Value**: `re_2r66JDEL_HygXv2P1Hr8o5bZV4yeRPcRy`

### Secret 2: SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE`

### Secret 3: SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Value**: `https://xipjxcktpzanmhfrkbrm.supabase.co`

## 📁 **Step 2: Create Edge Functions**

### Function 1: send-email

1. **Go to Edge Functions** in your Supabase dashboard
2. **Click "Create a new function"**
3. **Name**: `send-email`
4. **Copy and paste** the code from `supabase/functions/send-email/index.ts`

### Function 2: job-match-notification

1. **Click "Create a new function"** again
2. **Name**: `job-match-notification`
3. **Copy and paste** the code from `supabase/functions/job-match-notification/index.ts`

## 🧪 **Step 3: Test the Functions**

### Test send-email function:
```bash
curl -X POST 'https://xipjxcktpzanmhfrkbrm.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello from KanduJobs!</h1><p>This is a test email.</p>"
  }'
```

### Test job-match-notification function:
```bash
curl -X POST 'https://xipjxcktpzanmhfrkbrm.supabase.co/functions/v1/job-match-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "your-user-id",
    "job_title": "Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA"
  }'
```

## 🔧 **Step 4: Update Frontend Service**

Make sure your frontend is using the correct Supabase URL. Update your environment variables:

```env
VITE_SUPABASE_URL=https://xipjxcktpzanmhfrkbrm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 📊 **Step 5: Monitor and Debug**

1. **Check Edge Function logs** in the Supabase dashboard
2. **Check Resend dashboard** for email delivery status
3. **Check email_notifications table** for tracking

## 🎯 **Integration Examples**

### In your React app:
```javascript
import { emailNotificationService } from './src/services/emailNotificationService';

// Send job match notification
await emailNotificationService.sendJobMatchNotification({
  user_id: currentUser.id,
  job_title: 'Software Engineer',
  company: 'Tech Corp',
  location: 'San Francisco, CA'
});
```

## 🛠️ **Troubleshooting**

### Common Issues:
1. **"Function not found"** - Make sure function names match exactly
2. **"RESEND_API_KEY not configured"** - Check secrets in dashboard
3. **"User profile not found"** - Ensure user exists in profiles table
4. **CORS errors** - Functions include CORS headers

### Debug Steps:
1. Check Edge Function logs in Supabase dashboard
2. Check Resend logs for email delivery
3. Verify environment variables are set correctly
4. Test with simple curl commands first

---

**Need help?** Check the Supabase Edge Functions documentation or the function logs for specific error messages.
