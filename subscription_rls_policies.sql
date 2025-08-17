-- Row Level Security (RLS) Policies for Subscription and Payment Tables

-- Enable RLS on all subscription and payment tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_trials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Users can only view their own subscription data
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own subscription data (for preferences, etc.)
CREATE POLICY "Users can update own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert/update subscription data (for webhooks)
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- PAYMENT_HISTORY TABLE POLICIES
-- ============================================================================

-- Users can only view their own payment history
CREATE POLICY "Users can view own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert payment records (for webhooks)
CREATE POLICY "Service role can insert payment history" ON payment_history
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Service role can update payment records (for status updates)
CREATE POLICY "Service role can update payment history" ON payment_history
    FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE POLICIES
-- ============================================================================

-- Anyone can view subscription plans (public pricing information)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
    FOR SELECT USING (true);

-- Only service role can manage subscription plans
CREATE POLICY "Service role can manage subscription plans" ON subscription_plans
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- FREE_TRIALS TABLE POLICIES
-- ============================================================================

-- Users can only view their own trial data
CREATE POLICY "Users can view own trial" ON free_trials
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert trial records
CREATE POLICY "Service role can insert trials" ON free_trials
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Service role can update trial records (for expiration, conversion status)
CREATE POLICY "Service role can update trials" ON free_trials
    FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================================
-- ADDITIONAL SECURITY MEASURES
-- ============================================================================

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_rls ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id_rls ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_free_trials_user_id_rls ON free_trials(user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT ON user_subscriptions TO authenticated;
GRANT SELECT ON payment_history TO authenticated;
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT ON free_trials TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON user_subscriptions TO service_role;
GRANT ALL ON payment_history TO service_role;
GRANT ALL ON subscription_plans TO service_role;
GRANT ALL ON free_trials TO service_role;

-- ============================================================================
-- FUNCTION TO CHECK USER ACCESS (for use in other policies)
-- ============================================================================

-- Function to check if user has active subscription or trial
CREATE OR REPLACE FUNCTION check_user_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_subscription BOOLEAN;
    has_trial BOOLEAN;
BEGIN
    -- Check for active subscription
    SELECT EXISTS(
        SELECT 1 FROM user_subscriptions 
        WHERE user_id = user_uuid 
        AND status IN ('active', 'trialing')
        AND current_period_end > NOW()
    ) INTO has_subscription;
    
    -- Check for active trial
    SELECT EXISTS(
        SELECT 1 FROM free_trials 
        WHERE user_id = user_uuid 
        AND is_active = true 
        AND expires_at > NOW()
    ) INTO has_trial;
    
    RETURN has_subscription OR has_trial;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POLICIES FOR EXISTING TABLES THAT MIGHT NEED SUBSCRIPTION CHECKS
-- ============================================================================

-- Example: If you want to limit job applications based on subscription
-- (Uncomment and modify as needed)

/*
-- Limit job applications for users without active subscription
CREATE POLICY "Users with subscription can apply to jobs" ON job_swipes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        (check_user_access(auth.uid()) OR swipe_direction = 'left')
    );

-- Limit auto-apply usage for users without subscription
CREATE POLICY "Users with subscription can use auto-apply" ON profiles
    FOR UPDATE USING (
        auth.uid() = id AND 
        (check_user_access(auth.uid()) OR auto_applies_used_today <= 10)
    );
*/

-- ============================================================================
-- AUDIT LOGGING (Optional - for compliance)
-- ============================================================================

-- Create audit table for subscription changes
CREATE TABLE IF NOT EXISTS subscription_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS on audit table
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can view audit logs
CREATE POLICY "Service role can view audit logs" ON subscription_audit_log
    FOR SELECT USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON subscription_audit_log TO service_role;

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING (Optional)
-- ============================================================================

-- Function to log changes
CREATE OR REPLACE FUNCTION log_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO subscription_audit_log (table_name, operation, user_id, record_id, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.user_id, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO subscription_audit_log (table_name, operation, user_id, record_id, old_values, new_values)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.user_id, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO subscription_audit_log (table_name, operation, user_id, record_id, old_values)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.user_id, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE TRIGGER audit_user_subscriptions
    AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION log_subscription_changes();

CREATE TRIGGER audit_payment_history
    AFTER INSERT OR UPDATE OR DELETE ON payment_history
    FOR EACH ROW EXECUTE FUNCTION log_subscription_changes();

CREATE TRIGGER audit_free_trials
    AFTER INSERT OR UPDATE OR DELETE ON free_trials
    FOR EACH ROW EXECUTE FUNCTION log_subscription_changes();
