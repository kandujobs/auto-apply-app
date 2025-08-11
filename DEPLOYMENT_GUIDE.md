# Deployment Guide - Job Application Platform

This guide will walk you through deploying your job application platform to production.

## Prerequisites

- [Vercel](https://vercel.com) account (for frontend)
- [Railway](https://railway.app) account (for backend)
- [Supabase](https://supabase.com) project (already configured)
- [GitHub](https://github.com) repository

## Step 1: Environment Variables Setup

### Frontend Environment Variables (Vercel)

Create a `.env.local` file in your project root with:

```bash
VITE_SUPABASE_URL=https://xipjxcktpzanmhfrkbrm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgwNDMsImV4cCI6MjA2NjY5NDA0M30.i7rLdAIQ4hc9r95MeDlCyORELOEg4jDbKDMTooYsnzo
```

### Backend Environment Variables (Railway)

Set these environment variables in Railway:

```bash
SUPABASE_URL=https://xipjxcktpzanmhfrkbrm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpcGp4Y2t0cHphbm1oZnJrYnJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODA0MywiZXhwIjoyMDY2Njk0MDQzfQ.Dm73I66zlS1RXYcde6QHdTQt32ARu00K9pXeFuIruJE
PORT=3001
WS_PORT=3002
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.vercel.app
BROWSER_HEADLESS=true
BROWSER_SLOW_MO=1000
PAGE_LOAD_TIMEOUT=30000
ELEMENT_WAIT_TIMEOUT=10000
RESUME_PATH=./resume.pdf
SCREENSHOT_DIR=./screenshots
ENCRYPTION_KEY=your-secret-key-here
```

**Note:** LinkedIn credentials are stored securely in the Supabase `linkedin_credentials` table with encryption and Row Level Security (RLS). The `LINKEDIN_EMAIL` and `LINKEDIN_PASSWORD` environment variables are only used for testing/development purposes.

**Encryption Key:** The application uses `'your-secret-key-here'` as the default encryption key for LinkedIn credentials. This key is already configured in both frontend and backend code. You can override it by setting the `ENCRYPTION_KEY` environment variable.

**Local Development:** Copy `backend/env.backend` to `backend/.env` and update the values for local development.

## Step 2: Frontend Deployment (Vercel)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: Vite
     - Build Command: `npm run build:prod`
     - Output Directory: `dist`
   - Add environment variables from Step 1
   - Deploy

3. **Configure Custom Domain (Optional)**
   - In Vercel dashboard, go to your project
   - Click "Settings" → "Domains"
   - Add your custom domain

## Step 3: Backend Deployment (Railway)

1. **Deploy to Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the configuration

2. **Configure Environment Variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add all environment variables from Step 1
   - Update `CORS_ORIGIN` with your Vercel domain

3. **Configure Domain**
   - In Railway dashboard, go to "Settings"
   - Copy the generated domain
   - Update your frontend environment variables with this domain

## Step 4: Database Configuration (Supabase)

1. **Verify Supabase Setup**
   - Ensure your Supabase project is in production mode
   - Verify all tables are created
   - Check Row Level Security (RLS) policies

2. **LinkedIn Credentials Security**
   - Verify the `linkedin_credentials` table has proper RLS policies
   - Ensure the encryption key is set in environment variables
   - Test that users can save and retrieve their credentials securely

3. **Run Database Migrations**
   ```bash
   # Run any pending migrations
   node run_migrations.cjs
   ```

4. **Configure Storage**
   - Ensure storage buckets are properly configured
   - Verify storage policies are in place

## Step 5: Testing Production Deployment

1. **Test Frontend**
   - Visit your Vercel domain
   - Test user registration/login
   - Test job swiping functionality
   - Test resume upload

2. **Test Backend**
   - Test health check endpoint: `https://your-backend-domain.railway.app/api/health`
   - Test WebSocket connection
   - Test auto-apply functionality

3. **Test Integration**
   - Test complete user flow from frontend to backend
   - Verify data is being saved to Supabase
   - Test error handling

## Step 6: Monitoring & Analytics

1. **Set up Error Tracking**
   - [Sentry](https://sentry.io) for error monitoring
   - Configure for both frontend and backend

2. **Set up Analytics**
   - [Google Analytics](https://analytics.google.com) for user tracking
   - [Mixpanel](https://mixpanel.com) for event tracking

3. **Set up Logging**
   - Configure Railway logs
   - Set up log aggregation

## Step 7: Security & Performance

1. **Security Headers**
   - Verify security headers are in place (configured in vercel.json)
   - Test CORS configuration

2. **Performance Optimization**
   - Enable Vercel edge caching
   - Optimize images and assets
   - Monitor Core Web Vitals

3. **Rate Limiting**
   - Implement API rate limiting
   - Monitor for abuse

## Step 8: Launch Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and responding
- [ ] Database connected and working
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] SSL/HTTPS enabled
- [ ] Error monitoring set up
- [ ] Analytics configured
- [ ] Performance optimized
- [ ] Security measures in place
- [ ] User testing completed
- [ ] Documentation updated

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `CORS_ORIGIN` is set correctly
   - Check that the frontend domain matches exactly

2. **Environment Variables**
   - Ensure all variables are set in both Vercel and Railway
   - Check for typos in variable names

3. **Database Connection**
   - Verify Supabase credentials
   - Check network connectivity

4. **Build Failures**
   - Check build logs in Vercel
   - Verify all dependencies are installed

### Support

- Vercel: [Documentation](https://vercel.com/docs)
- Railway: [Documentation](https://docs.railway.app)
- Supabase: [Documentation](https://supabase.com/docs)

## Next Steps

After successful deployment:

1. **Monitor Performance**
   - Set up performance monitoring
   - Track user engagement

2. **Scale Infrastructure**
   - Monitor resource usage
   - Scale as needed

3. **Feature Development**
   - Continue development based on user feedback
   - Implement new features

4. **Marketing & Growth**
   - Launch marketing campaigns
   - Gather user feedback
   - Iterate on product
