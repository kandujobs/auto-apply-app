# Kandu Deployment Setup Guide

This guide explains how to deploy the two-repository structure for Kandu:

1. **Landing Page** (`kandu-landing-page/`) → `kandujobs.com`
2. **Main App** (current repo) → `app.kandujobs.com`

## Repository Structure

```
kandu-landing-page/          # Landing page repository
├── src/
│   ├── components/
│   │   └── LandingPage.tsx  # Main landing page with redirects
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── vercel.json

sandbox - First Launch/      # Main app repository (current)
├── src/
│   ├── Components/
│   │   ├── Onboarding/      # Auth & onboarding components
│   │   ├── HomeScreen.tsx
│   │   └── ...
│   ├── App.tsx
│   └── ...
├── package.json
└── ...
```

## Deployment Steps

### 1. Landing Page Deployment (`kandujobs.com`)

1. **Create a new repository** for the landing page:
   ```bash
   # Create a new GitHub repository called "kandu-landing-page"
   ```

2. **Push the landing page code**:
   ```bash
   cd kandu-landing-page
   git init
   git add .
   git commit -m "Initial landing page setup"
   git branch -M main
   git remote add origin https://github.com/yourusername/kandu-landing-page.git
   git push -u origin main
   ```

3. **Deploy to Vercel**:
   - Connect the `kandu-landing-page` repository to Vercel
   - Set the domain to `kandujobs.com`
   - Deploy

### 2. Main App Deployment (`app.kandujobs.com`)

1. **Update the main app** to handle subdomain routing:
   - The main app should be deployed to `app.kandujobs.com`
   - All authentication and onboarding flows remain in the main app

2. **Deploy the main app**:
   - Connect the current repository to Vercel
   - Set the domain to `app.kandujobs.com`
   - Deploy

## Domain Configuration

### DNS Setup

Configure your DNS provider with the following records:

```
Type    Name    Value
A       @       <Vercel IP for landing page>
CNAME   app     <Vercel domain for main app>
```

### Vercel Configuration

1. **Landing Page Vercel Settings**:
   - Domain: `kandujobs.com`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Main App Vercel Settings**:
   - Domain: `app.kandujobs.com`
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

## User Flow

1. **User visits `kandujobs.com`**:
   - Sees the landing page with features and benefits
   - Clicks "Get Started" or "Sign In"
   - Gets redirected to `app.kandujobs.com`

2. **User visits `app.kandujobs.com`**:
   - Goes directly to the main application
   - Can sign up, sign in, or access the full app

## Development Workflow

### Landing Page Development
```bash
cd kandu-landing-page
npm install
npm run dev
# Visit http://localhost:3000
```

### Main App Development
```bash
# In the main repository
npm install
npm run dev
# Visit http://localhost:5173 (or whatever port Vite uses)
```

## Testing the Redirects

1. **Local Testing**:
   - Update the redirect URLs in `LandingPage.tsx` to point to your local development server
   - Test the redirect functionality

2. **Production Testing**:
   - Deploy both applications
   - Test the redirects from `kandujobs.com` to `app.kandujobs.com`

## Security Considerations

1. **HTTPS**: Ensure both domains use HTTPS
2. **CORS**: Configure CORS if needed for API calls between domains
3. **Cookies**: Consider cookie domain settings for authentication
4. **Security Headers**: Both applications include security headers in their Vercel configuration

## Monitoring

1. **Analytics**: Set up analytics to track user flow from landing page to main app
2. **Error Tracking**: Monitor for redirect failures or broken links
3. **Performance**: Monitor load times for both applications

## Backup and Rollback

1. **Version Control**: Both repositories should use proper version control
2. **Deployment History**: Vercel provides deployment history for easy rollbacks
3. **Database**: Ensure the main app's database is properly backed up

## Next Steps

1. Set up the GitHub repositories
2. Configure Vercel deployments
3. Set up DNS records
4. Test the complete user flow
5. Monitor and optimize performance
