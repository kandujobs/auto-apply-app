#!/bin/bash

# Deployment Script for Job Application Platform
# This script helps prepare and deploy the application

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install dependencies
print_status "Installing frontend dependencies..."
npm install

print_status "Installing backend dependencies..."
cd backend && npm install && cd ..

# Step 2: Build frontend
print_status "Building frontend for production..."
npm run build:prod

# Step 3: Check environment variables
print_status "Checking environment variables..."

if [ ! -f ".env.local" ]; then
    print_warning "No .env.local file found. Please create one with your environment variables."
    echo "See env.example for reference."
else
    print_status "Environment file found."
fi

# Step 4: Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Please commit them before deploying."
    git status --short
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

# Step 5: Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You're not on the main branch. Current branch: $CURRENT_BRANCH"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

# Step 6: Push to git
print_status "Pushing to git..."
git add .
git commit -m "Deploy to production - $(date)"
git push origin main

print_status "Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy frontend to Vercel: https://vercel.com"
echo "2. Deploy backend to Railway: https://railway.app"
echo "3. Configure environment variables in both platforms"
echo "4. Test the deployment"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
