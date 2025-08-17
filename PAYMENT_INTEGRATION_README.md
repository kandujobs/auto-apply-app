# KanduJobs Payment Integration Guide

This guide explains the complete payment integration flow for KanduJobs, including Stripe setup, database schema, and user flow.

## 🎯 Overview

The payment integration follows this user flow:

1. **Landing Page** → "Start Free Trial" CTA
2. **Signup & Onboarding** → Email, resume upload, preferences
3. **Paywall** → 2-day free trial prompt with subscription plans
4. **Trial Period** → Full access for 2 days
5. **Upgrade Flow** → Seamless upgrade to paid plans

## 🏗️ Architecture

### Database Schema

The payment system uses these tables:

- `user_subscriptions` - User subscription data
- `payment_history` - Payment transaction records
- `subscription_plans` - Available subscription plans
- `free_trials` - Free trial tracking

### Backend Services

- **PaymentService** (`backend/paymentService.js`) - Stripe integration
- **Payment Routes** - REST API endpoints for payment operations
- **Webhook Handler** - Stripe webhook processing

### Frontend Components

- **PaywallScreen** - Free trial signup flow
- **TrialExpiryBanner** - Trial expiration notifications
- **UpgradeModal** - Subscription upgrade interface
- **PaymentService** - Frontend payment API client

## 🚀 Setup Instructions

### 1. Stripe Configuration

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Create subscription products and prices in Stripe:
   - **Starter Plan**: $19.99/month, $199.90/year
   - **Professional Plan**: $39.99/month, $399.90/year

### 2. Environment Variables

Add these to your `.env` files:

```bash
# Backend (.env)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend (.env)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 3. Database Setup

Run the subscription schema:

```sql
-- Run subscription_schema.sql
\i subscription_schema.sql
```

### 4. Stripe Webhook Setup

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.com/api/payment/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 📋 User Flow Details

### 1. Landing Page → Signup

- User clicks "Start Free Trial" on landing page
- Redirects to `app.kandujobs.com/signup`
- User completes email/password signup

### 2. Onboarding Flow

- **Email Verification** - User verifies email
- **Resume Upload** - User uploads resume
- **Basic Info** - Name, location, preferences
- **Experience** - Work history and education
- **Interests** - Skills and job preferences
- **Tutorial** - App walkthrough

### 3. Paywall Screen

After onboarding, users see the paywall with:

- **2-Day Free Trial** - No credit card required
- **Subscription Plans** - Starter ($19.99) and Professional ($39.99)
- **Feature Comparison** - Clear value proposition
- **Trust Indicators** - Security, cancellation policy

### 4. Trial Period

During the 2-day trial:

- **Full Access** - All features available
- **Trial Banner** - Shows days remaining
- **Upgrade Prompts** - Non-intrusive upgrade suggestions

### 5. Upgrade Flow

When trial expires:

- **Expiry Banner** - Prominent upgrade prompt
- **Upgrade Modal** - Detailed plan comparison
- **Seamless Payment** - Stripe Checkout integration

## 💳 Subscription Plans

### Free Trial
- **Duration**: 2 days
- **Features**: Basic job search, resume upload
- **Limits**: 10 job applications, 1 resume

### Starter Plan ($19.99/month)
- **Features**: Unlimited job search, resume optimization, basic auto-apply
- **Limits**: 50 job applications, 3 resumes
- **Auto-apply**: Basic automation

### Professional Plan ($39.99/month)
- **Features**: Everything in Starter + unlimited applications, priority support
- **Limits**: Unlimited applications, unlimited resumes
- **Auto-apply**: Advanced automation
- **Support**: Priority customer support

## 🔧 Technical Implementation

### Backend API Endpoints

```javascript
// Create Stripe customer
POST /api/payment/create-customer
{ email, name }

// Create subscription with trial
POST /api/payment/create-subscription
{ customerId, priceId, userId, trialDays }

// Check user access
GET /api/payment/user-access/:userId

// Get subscription plans
GET /api/payment/subscription-plans

// Create free trial
POST /api/payment/create-free-trial
{ userId, trialDays }

// Cancel subscription
POST /api/payment/cancel-subscription
{ subscriptionId, cancelAtPeriodEnd }
```

### Frontend Integration

```typescript
// Check user access
const access = await paymentService.checkUserAccess(userId);

// Create subscription
const subscription = await paymentService.createSubscription(
  customerId,
  priceId,
  userId,
  2 // trial days
);

// Format prices
const price = paymentService.formatPrice(1999); // $19.99
```

### Database Queries

```sql
-- Check if user has active subscription
SELECT * FROM user_subscriptions 
WHERE user_id = ? AND status IN ('active', 'trialing');

-- Check if user has active trial
SELECT * FROM free_trials 
WHERE user_id = ? AND is_active = true 
AND expires_at > NOW();
```

## 🎨 UI Components

### PaywallScreen
- Modern, conversion-optimized design
- Clear value proposition
- Trust indicators and social proof
- Mobile-responsive layout

### TrialExpiryBanner
- Non-intrusive banner design
- Dynamic messaging based on trial status
- Clear upgrade CTA
- Dismissible for better UX

### UpgradeModal
- Detailed plan comparison
- Feature breakdown
- Pricing calculator
- Secure payment flow

## 🔒 Security & Compliance

### Data Protection
- All payment data processed by Stripe
- No credit card data stored locally
- PCI DSS compliant through Stripe
- Encrypted data transmission

### Access Control
- User authentication required
- Subscription status validation
- Trial period enforcement
- Graceful degradation for expired users

## 📊 Analytics & Monitoring

### Key Metrics to Track
- **Conversion Rate**: Trial → Paid
- **Trial Completion Rate**: Onboarding → Trial
- **Churn Rate**: Monthly subscription cancellations
- **ARPU**: Average Revenue Per User
- **LTV**: Customer Lifetime Value

### Monitoring Points
- Payment processing success/failure rates
- Webhook delivery status
- Subscription status changes
- Trial expiration events

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Failures**
   - Check webhook endpoint URL
   - Verify webhook secret
   - Monitor webhook delivery logs

2. **Payment Processing Errors**
   - Validate Stripe API keys
   - Check customer creation
   - Verify subscription creation

3. **Trial Access Issues**
   - Check free_trials table
   - Verify trial expiration logic
   - Monitor user access checks

### Debug Commands

```bash
# Check subscription status
curl -X GET "https://your-api.com/api/payment/user-access/USER_ID"

# Test webhook endpoint
curl -X POST "https://your-api.com/api/payment/webhook" \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'

# Verify database schema
psql -d your_database -f subscription_schema.sql
```

## 🔄 Future Enhancements

### Planned Features
- **Annual Discounts** - Better yearly pricing
- **Team Plans** - Multi-user subscriptions
- **Usage Analytics** - Detailed usage tracking
- **A/B Testing** - Pricing optimization
- **Referral Program** - User acquisition

### Integration Opportunities
- **Email Marketing** - Trial nurture sequences
- **Analytics** - Conversion funnel tracking
- **Support** - Priority support integration
- **Notifications** - Trial expiry reminders

## 📞 Support

For payment integration support:

1. **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
2. **KanduJobs Support**: support@kandujobs.com
3. **Technical Issues**: dev@kandujobs.com

---

**Note**: This payment integration is designed to be scalable, secure, and user-friendly. Regular monitoring and optimization are recommended for best results.
