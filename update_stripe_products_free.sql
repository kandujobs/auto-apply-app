-- Update subscription plans with Free, Starter, and Professional tiers
-- This creates a freemium model with a free tier

-- First, clear existing plans
DELETE FROM subscription_plans;

-- Insert the new pricing structure
INSERT INTO subscription_plans (
    name, 
    stripe_price_id, 
    price_monthly, 
    price_yearly, 
    features, 
    max_job_applications, 
    max_resume_uploads, 
    auto_apply_enabled, 
    priority_support,
    is_active
) VALUES
-- Free Tier (No Stripe product needed)
('Free', NULL, 0, 0, 
 '["Basic job search", "Resume upload", "Limited applications", "Basic job matching"]', 
 10, 1, FALSE, FALSE, TRUE),

-- KanduJobs Starter
('Starter', 'price_1RxSRoFdjOQFWIuB3KWl6Sx5', 1900, 19000, 
 '["Everything in Free", "Unlimited applications", "Auto-apply", "Advanced job matching", "Resume optimization"]', 
 NULL, 3, TRUE, FALSE, TRUE),

('Starter Yearly', 'price_1RxSRoFdjOQFWIuBqTlVHdur', 1900, 19000, 
 '["Everything in Free", "Unlimited applications", "Auto-apply", "Advanced job matching", "Resume optimization", "Save 17%"]', 
 NULL, 3, TRUE, FALSE, TRUE),

-- KanduJobs Professional  
('Professional', 'price_1RxSTkFdjOQFWIuBQhuCmMWs', 3900, 24000, 
 '["Everything in Starter", "Priority support", "Advanced analytics", "Premium job matching", "Interview prep resources"]', 
 NULL, NULL, TRUE, TRUE, TRUE),

('Professional Yearly', 'price_1RxSTkFdjOQFWIuBX6kUScMg', 3900, 24000, 
 '["Everything in Starter", "Priority support", "Advanced analytics", "Premium job matching", "Interview prep resources", "Save 49%"]', 
 NULL, NULL, TRUE, TRUE, TRUE);

-- Verify the plans were inserted correctly
SELECT 
    name, 
    stripe_price_id, 
    price_monthly, 
    price_yearly,
    features,
    auto_apply_enabled,
    priority_support
FROM subscription_plans 
ORDER BY price_monthly ASC;
