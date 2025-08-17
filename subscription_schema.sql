-- Subscription and Payment Schema for KanduJobs

-- Table for user subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'inactive', -- 'inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
    plan_type TEXT NOT NULL, -- 'free_trial', 'monthly', 'yearly'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table for payment history
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT,
    amount INTEGER NOT NULL, -- Amount in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending', 'canceled'
    payment_method TEXT, -- 'card', 'paypal', etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    stripe_price_id TEXT UNIQUE,
    price_monthly INTEGER NOT NULL, -- Price in cents
    price_yearly INTEGER NOT NULL, -- Price in cents
    features JSONB NOT NULL, -- Array of features included
    max_job_applications INTEGER, -- NULL for unlimited
    max_resume_uploads INTEGER, -- NULL for unlimited
    auto_apply_enabled BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for free trial tracking
CREATE TABLE IF NOT EXISTS free_trials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    converted_to_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, stripe_price_id, price_monthly, price_yearly, features, max_job_applications, max_resume_uploads, auto_apply_enabled, priority_support) VALUES
('Free Trial', 'price_free_trial', 0, 0, '["Basic job search", "Resume upload", "2-day trial"]', 10, 1, FALSE, FALSE),
('Starter', 'price_starter_monthly', 1999, 19990, '["Unlimited job search", "Resume optimization", "Basic auto-apply"]', 50, 3, TRUE, FALSE),
('Professional', 'price_professional_monthly', 3999, 39990, '["Everything in Starter", "Unlimited applications", "Priority support", "Advanced analytics"]', NULL, NULL, TRUE, TRUE);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment_intent_id ON payment_history(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_free_trials_user_id ON free_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_free_trials_is_active ON free_trials(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Run subscription_rls_policies.sql after this file to enable Row Level Security
