#!/bin/bash

echo "🚀 Setting up Email Notifications for KanduJobs"
echo "================================================"

# Check if Supabase CLI is available
if ! command -v npx supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Get project reference
echo ""
echo "📋 Please provide your Supabase project details:"
echo "   (You can find these in your Supabase dashboard)"
echo ""

read -p "Enter your Supabase Project Reference (e.g., xipjxcktpzanmhfrkbrm): " PROJECT_REF
read -p "Enter your Supabase URL (e.g., https://xipjxcktpzanmhfrkbrm.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase Service Role Key: " SERVICE_ROLE_KEY

# Validate inputs
if [ -z "$PROJECT_REF" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "❌ All fields are required!"
    exit 1
fi

echo ""
echo "🔧 Setting up Supabase project..."

# Link project
echo "Linking project..."
npx supabase link --project-ref $PROJECT_REF

# Set secrets
echo "Setting Resend API key..."
npx supabase secrets set RESEND_API_KEY=re_2r66JDEL_HygXv2P1Hr8o5bZV4yeRPcRy

echo "Setting Supabase service role key..."
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

echo "Setting Supabase URL..."
npx supabase secrets set SUPABASE_URL=$SUPABASE_URL

# Deploy functions
echo ""
echo "🚀 Deploying Edge Functions..."
npx supabase functions deploy send-email
npx supabase functions deploy job-match-notification

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run the SQL migrations in your Supabase SQL editor:"
echo "   - add_updated_at_to_profiles.sql"
echo "   - email_notifications_schema.sql"
echo "   - add_notification_privacy_settings.sql"
echo ""
echo "2. Test the system by calling the email service from your app"
echo ""
echo "3. Check the Supabase dashboard > Edge Functions to see your deployed functions"
echo ""
echo "🔗 Your Supabase project: $SUPABASE_URL"
echo "🔑 Resend API key: re_2r66JDEL_HygXv2P1Hr8o5bZV4yeRPcRy"
