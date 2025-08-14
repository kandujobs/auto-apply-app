#!/bin/bash

# Setup script for Kandu Landing Page Repository
echo "🚀 Setting up Kandu Landing Page Repository..."

# Check if we're in the right directory
if [ ! -d "kandu-landing-page" ]; then
    echo "❌ Error: kandu-landing-page directory not found!"
    echo "Please run this script from the main project directory."
    exit 1
fi

# Navigate to landing page directory
cd kandu-landing-page

# Initialize git repository
echo "📁 Initializing git repository..."
git init

# Add all files
echo "📝 Adding files to git..."
git add .

# Initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial landing page setup with redirects to app.kandujobs.com"

# Set main branch
git branch -M main

echo "✅ Landing page repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new GitHub repository called 'kandu-landing-page'"
echo "2. Add the remote origin:"
echo "   git remote add origin https://github.com/yourusername/kandu-landing-page.git"
echo "3. Push to GitHub:"
echo "   git push -u origin main"
echo "4. Deploy to Vercel with domain: kandujobs.com"
echo ""
echo "🔗 The landing page will redirect users to app.kandujobs.com"
