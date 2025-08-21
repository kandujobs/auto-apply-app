const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../config/database');

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  isAvailable() {
    return !!process.env.STRIPE_SECRET_KEY;
  }

  // Create a Stripe customer
  async createCustomer(email, name = null) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'kandujobs'
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a subscription with payment method collection
  async createSubscription(customerId, priceId, trialDays = 2) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Create a checkout session for trial with payment method collection
  async createTrialCheckoutSession(customerId, priceId, successUrl, cancelUrl, trialDays = 2) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          trial_period_days: trialDays,
          metadata: {
            trial_type: 'free_trial'
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        payment_method_collection: 'always',
        // Enable automatic tax calculation if needed
        automatic_tax: {
          enabled: true,
        },
        // Enable customer updates
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
        // Enable Apple Pay and Google Pay automatically when available
        payment_method_options: {
          card: {
            request_three_d_secure: 'automatic',
          },
        },
      });
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create a payment intent
  async createPaymentIntent(amount, currency = 'usd', customerId = null) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Get subscription plans
  async getSubscriptionPlans() {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });
      return prices.data;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  // Create a free trial subscription
  async createFreeTrial(customerId, priceId, trialDays = 2) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      return subscription;
    } catch (error) {
      console.error('Error creating free trial:', error);
      throw error;
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Handle subscription created
  async handleSubscriptionCreated(subscription) {
    try {
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (!existingSubscription) {
        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            metadata: subscription.metadata
          });

        if (error) {
          console.error('Error inserting subscription:', error);
        } else {
          console.log('Subscription created in database:', data);
        }
      }
    } catch (error) {
      console.error('Error handling subscription created:', error);
    }
  }

  // Handle subscription updated
  async handleSubscriptionUpdated(subscription) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          price_id: subscription.items.data[0].price.id,
          quantity: subscription.items.data[0].quantity,
          metadata: subscription.metadata
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating subscription:', error);
      } else {
        console.log('Subscription updated in database:', data);
      }
    } catch (error) {
      console.error('Error handling subscription updated:', error);
    }
  }

  // Handle subscription deleted
  async handleSubscriptionDeleted(subscription) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          canceled_at: new Date(subscription.canceled_at * 1000)
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating deleted subscription:', error);
      } else {
        console.log('Subscription deleted in database:', data);
      }
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
    }
  }

  // Handle payment succeeded
  async handlePaymentSucceeded(invoice) {
    try {
      console.log('Payment succeeded for invoice:', invoice.id);
      // Add any additional logic for successful payments
    } catch (error) {
      console.error('Error handling payment succeeded:', error);
    }
  }

  // Handle payment failed
  async handlePaymentFailed(invoice) {
    try {
      console.log('Payment failed for invoice:', invoice.id);
      // Add any additional logic for failed payments
    } catch (error) {
      console.error('Error handling payment failed:', error);
    }
  }

  // Get user access level
  async getUserAccess(userId) {
    // Bypass access checks in development mode for testing
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_PAYMENT_CHECKS === 'true') {
      console.log('🔓 Bypassing user access check for development/testing - granting access to user:', userId);
      return { 
        hasAccess: true, 
        subscription: {
          id: 'dev-mock-subscription',
          status: 'active',
          trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }
      };
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile || !profile.stripe_customer_id) {
        return { hasAccess: false, subscription: null };
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_customer_id', profile.stripe_customer_id)
        .eq('status', 'active')
        .single();

      if (!subscription) {
        return { hasAccess: false, subscription: null };
      }

      return { hasAccess: true, subscription };
    } catch (error) {
      console.error('Error getting user access:', error);
      return { hasAccess: false, subscription: null };
    }
  }
}

module.exports = new PaymentService();
