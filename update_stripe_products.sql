-- Update subscription plans with actual Stripe products and pricing
-- This replaces the placeholder plans with the real Stripe products

-- First, clear existing plans
DELETE FROM subscription_plans;

-- Insert the actual Stripe products with correct pricing
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
-- KanduJobs Starter
('Starter', 'price_1RxSRoFdjOQFWIuB3KWl6Sx5', 1900, 19000, 
 '["Basic job search", "Resume upload", "2-day trial", "Limited applications"]', 
 50, 3, TRUE, FALSE, TRUE),

('Starter Yearly', 'price_1RxSRoFdjOQFWIuBqTlVHdur', 1900, 19000, 
 '["Basic job search", "Resume upload", "2-day trial", "Limited applications", "Save 17%"]', 
 50, 3, TRUE, FALSE, TRUE),

-- KanduJobs Professional  
('Professional', 'price_1RxSTkFdjOQFWIuBQhuCmMWs', 3900, 24000, 
 '["Everything in Starter", "Unlimited applications", "Priority support", "Advanced analytics", "Auto-apply"]', 
 NULL, NULL, TRUE, TRUE, TRUE),

('Professional Yearly', 'price_1RxSTkFdjOQFWIuBX6kUScMg', 3900, 24000, 
 '["Everything in Starter", "Unlimited applications", "Priority support", "Advanced analytics", "Auto-apply", "Save 49%"]', 
 NULL, NULL, TRUE, TRUE, TRUE),

-- KanduJobs Ultra (New Premium Tier)
('Ultra', 'price_1RxSVdFdjOQFWIuBXDho98wI', 5900, 34000, 
 '["Everything in Professional", "Premium job matching", "1-on-1 career coaching", "Resume optimization", "Interview prep", "Priority queue"]', 
 NULL, NULL, TRUE, TRUE, TRUE),

('Ultra Yearly', 'price_1RxSVdFdjOQFWIuB1ryp4Ubn', 5900, 34000, 
 '["Everything in Professional", "Premium job matching", "1-on-1 career coaching", "Resume optimization", "Interview prep", "Priority queue", "Save 52%"]', 
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
