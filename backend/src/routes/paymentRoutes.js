const express = require('express');
const router = express.Router();
const PaymentService = require('../services/paymentService');
const { checkPaymentService } = require('../middlewares/paymentMiddleware');
const { supabase } = require('../config/database');

// Create a Stripe customer
router.post('/create-customer', checkPaymentService, async (req, res) => {
  try {
    const { email, name, userId } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const customer = await PaymentService.createCustomer(email, name);
    
    // Update user profile with Stripe customer ID
    if (userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating profile with Stripe customer ID:', error);
      }
    }

    res.json({ customer });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Create a subscription
router.post('/create-subscription', checkPaymentService, async (req, res) => {
  try {
    const { customerId, priceId, trialDays = 2 } = req.body;
    
    if (!customerId || !priceId) {
      return res.status(400).json({ error: 'Customer ID and Price ID are required' });
    }

    const subscription = await PaymentService.createSubscription(customerId, priceId, trialDays);
    res.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Create a trial checkout session
router.post('/create-trial-checkout', checkPaymentService, async (req, res) => {
  try {
    const { customerId, priceId, successUrl, cancelUrl, trialDays = 2 } = req.body;
    
    if (!customerId || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ 
        error: 'Customer ID, Price ID, Success URL, and Cancel URL are required' 
      });
    }

    const session = await PaymentService.createTrialCheckoutSession(
      customerId, 
      priceId, 
      successUrl, 
      cancelUrl, 
      trialDays
    );
    res.json({ session });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create a payment intent
router.post('/create-payment-intent', checkPaymentService, async (req, res) => {
  try {
    const { amount, currency = 'usd', customerId } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const paymentIntent = await PaymentService.createPaymentIntent(amount, currency, customerId);
    res.json({ paymentIntent });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Get subscription plans
router.get('/subscription-plans', checkPaymentService, async (req, res) => {
  try {
    const plans = await PaymentService.getSubscriptionPlans();
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Get user access level
router.get('/user-access/:userId', checkPaymentService, async (req, res) => {
  try {
    const { userId } = req.params;
    const access = await PaymentService.getUserAccess(userId);
    res.json(access);
  } catch (error) {
    console.error('Error getting user access:', error);
    res.status(500).json({ error: 'Failed to get user access' });
  }
});

// Create a free trial
router.post('/create-free-trial', checkPaymentService, async (req, res) => {
  try {
    const { customerId, priceId, trialDays = 2 } = req.body;
    
    if (!customerId || !priceId) {
      return res.status(400).json({ error: 'Customer ID and Price ID are required' });
    }

    const subscription = await PaymentService.createFreeTrial(customerId, priceId, trialDays);
    res.json({ subscription });
  } catch (error) {
    console.error('Error creating free trial:', error);
    res.status(500).json({ error: 'Failed to create free trial' });
  }
});

// Cancel a subscription
router.post('/cancel-subscription', checkPaymentService, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const subscription = await PaymentService.cancelSubscription(subscriptionId);
    res.json({ subscription });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), checkPaymentService, async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = require('stripe').webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await PaymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;
