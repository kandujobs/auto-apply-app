# 🔗 Stripe Webhook Setup Guide

## 🎯 **What Webhooks Do**

Webhooks automatically sync your database with Stripe events:
- ✅ Subscription created/updated/cancelled
- ✅ Payment succeeded/failed
- ✅ Trial ended
- ✅ Customer updated

## 📋 **Step 1: Get Your Railway App URL**

Your webhook endpoint will be: `https://your-railway-app.railway.app/api/payment/webhook`

**To find your Railway URL:**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your KanduJobs project
3. Copy the domain from the "Deployments" tab
4. Your webhook URL will be: `https://[your-domain].railway.app/api/payment/webhook`

## 🔧 **Step 2: Set Up Webhook in Stripe Dashboard**

1. **Go to Stripe Dashboard** → [Webhooks](https://dashboard.stripe.com/webhooks)
2. **Click "Add endpoint"**
3. **Enter your webhook URL:**
   ```
   https://your-railway-app.railway.app/api/payment/webhook
   ```
4. **Select these events:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. **Click "Add endpoint"**
6. **Copy the webhook secret** (starts with `whsec_`)

## 🔐 **Step 3: Add Webhook Secret to Railway**

1. **Go to Railway Dashboard** → Your project → Variables
2. **Add this environment variable:**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```
3. **Redeploy your app** (Railway will auto-deploy)

## 🧪 **Step 4: Test the Webhook**

### **Option A: Use Stripe CLI (Recommended)**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local server (for testing)
stripe listen --forward-to localhost:3001/api/payment/webhook
```

### **Option B: Test in Stripe Dashboard**
1. Go to your webhook in Stripe Dashboard
2. Click "Send test webhook"
3. Select an event type (e.g., `customer.subscription.created`)
4. Click "Send test webhook"
5. Check your Railway logs for the webhook response

## 📊 **Step 5: Monitor Webhook Events**

### **Check Railway Logs:**
1. Go to Railway Dashboard → Your project → Deployments
2. Click on the latest deployment
3. Check the logs for webhook events

### **Check Stripe Dashboard:**
1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook
3. View "Recent deliveries" to see success/failure

## 🚨 **Common Issues & Solutions**

### **Webhook Fails (400/500 errors):**
- ✅ Check `STRIPE_WEBHOOK_SECRET` is set in Railway
- ✅ Verify webhook URL is correct
- ✅ Ensure your Railway app is running

### **Webhook Not Receiving Events:**
- ✅ Check Stripe Dashboard → Webhooks → Recent deliveries
- ✅ Verify events are selected in webhook settings
- ✅ Check Railway logs for errors

### **Signature Verification Fails:**
- ✅ Ensure webhook secret is correct
- ✅ Check that `express.raw()` middleware is used (already configured)

## 🎯 **Webhook Events Handled**

Your backend automatically handles these events:

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Save subscription to database |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Mark subscription as cancelled |
| `invoice.payment_succeeded` | Record successful payment |
| `invoice.payment_failed` | Handle payment failure |
| `customer.subscription.trial_will_end` | Send trial expiry notification |

## 🔄 **Next Steps**

1. **Run the SQL** to update subscription plans (Free, Starter, Professional)
2. **Set up the webhook** using the steps above
3. **Test with a real subscription** to verify everything works

## 📞 **Need Help?**

- Check Railway logs for errors
- Verify webhook secret is correct
- Test with Stripe CLI for local debugging
- Check Stripe Dashboard → Webhooks → Recent deliveries

---

**Your webhook endpoint is ready at:** `https://your-railway-app.railway.app/api/payment/webhook`



