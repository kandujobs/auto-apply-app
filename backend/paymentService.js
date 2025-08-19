const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Lazy initialization of Supabase client
let supabase = null;
function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Supabase environment variables are not configured');
    }
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }
  return supabase;
}

class PaymentService {
  constructor() {
    this.stripe = stripe;
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

  // Create a payment intent for one-time payments
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

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId, priceId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
      });
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Save subscription to database
  async saveSubscriptionToDatabase(userId, subscriptionData) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: subscriptionData.customer,
          stripe_subscription_id: subscriptionData.id,
          status: subscriptionData.status,
          plan_type: subscriptionData.items.data[0].price.recurring.interval,
          current_period_start: new Date(subscriptionData.current_period_start * 1000),
          current_period_end: new Date(subscriptionData.current_period_end * 1000),
          trial_start: subscriptionData.trial_start ? new Date(subscriptionData.trial_start * 1000) : null,
          trial_end: subscriptionData.trial_end ? new Date(subscriptionData.trial_end * 1000) : null,
          cancel_at_period_end: subscriptionData.cancel_at_period_end,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving subscription to database:', error);
      throw error;
    }
  }

  // Save payment to database
  async savePaymentToDatabase(userId, paymentData) {
    try {
      const { data, error } = await getSupabaseClient()
        .from('payment_history')
        .insert({
          user_id: userId,
          stripe_payment_intent_id: paymentData.id,
          stripe_invoice_id: paymentData.invoice,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status,
          payment_method: paymentData.payment_method_types?.[0] || 'card',
          description: paymentData.description,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving payment to database:', error);
      throw error;
    }
  }

  // Create free trial record
  async createFreeTrial(userId, trialDays = 2) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + trialDays);

      const { data, error } = await getSupabaseClient()
        .from('free_trials')
        .insert({
          user_id: userId,
          expires_at: expiresAt,
          is_active: true,
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating free trial:', error);
      throw error;
    }
  }

  // Check if user has active subscription or trial
  async checkUserAccess(userId) {
    try {
      // Check for active subscription
      const { data: subscription, error: subError } = await getSupabaseClient()
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.log('Subscription table error (non-critical):', subError);
        // Don't throw error, just log it and continue
      }

      if (subscription) {
        return {
          hasAccess: true,
          type: 'subscription',
          data: subscription,
          expiresAt: subscription.current_period_end
        };
      }

      // Check for active free trial
      const { data: trial, error: trialError } = await getSupabaseClient()
        .from('free_trials')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (trialError && trialError.code !== 'PGRST116') {
        console.log('Free trials table error (non-critical):', trialError);
        // Don't throw error, just log it and continue
      }

      if (trial) {
        return {
          hasAccess: true,
          type: 'trial',
          data: trial,
          expiresAt: trial.expires_at
        };
      }

      // Default: no access (show paywall)
      return {
        hasAccess: false,
        type: null,
        data: null,
        expiresAt: null
      };
    } catch (error) {
      console.error('Error checking user access:', error);
      // Return default no-access response instead of throwing
      return {
        hasAccess: false,
        type: null,
        data: null,
        expiresAt: null
      };
    }
  }

  // Get subscription plans
  async getSubscriptionPlans() {
    try {
      const { data, error } = await getSupabaseClient()
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        console.log('Subscription plans table error (non-critical):', error);
        // Return default plans if table doesn't exist
        return [
          {
            id: 'basic',
            name: 'Basic Plan',
            stripe_price_id: 'price_basic',
            price_monthly: 999,
            price_yearly: 9999,
            features: ['Up to 50 job applications per month', 'Basic job matching', 'Email support'],
            max_job_applications: 50,
            max_resume_uploads: 1,
            auto_apply_enabled: true,
            priority_support: false,
            is_active: true
          },
          {
            id: 'pro',
            name: 'Pro Plan',
            stripe_price_id: 'price_pro',
            price_monthly: 1999,
            price_yearly: 19999,
            features: ['Unlimited job applications', 'Advanced job matching', 'Priority support', 'Resume optimization'],
            max_job_applications: null,
            max_resume_uploads: 5,
            auto_apply_enabled: true,
            priority_support: true,
            is_active: true
          }
        ];
      }
      return data;
    } catch (error) {
      console.error('Error getting subscription plans:', error);
      // Return default plans as fallback
      return [
        {
          id: 'basic',
          name: 'Basic Plan',
          stripe_price_id: 'price_basic',
          price_monthly: 999,
          price_yearly: 9999,
          features: ['Up to 50 job applications per month', 'Basic job matching', 'Email support'],
          max_job_applications: 50,
          max_resume_uploads: 1,
          auto_apply_enabled: true,
          priority_support: false,
          is_active: true
        },
        {
          id: 'pro',
          name: 'Pro Plan',
          stripe_price_id: 'price_pro',
          price_monthly: 1999,
          price_yearly: 19999,
          features: ['Unlimited job applications', 'Advanced job matching', 'Priority support', 'Resume optimization'],
          max_job_applications: null,
          max_resume_uploads: 5,
          auto_apply_enabled: true,
          priority_support: true,
          is_active: true
        }
      ];
    }
  }

  // Handle webhook events
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionChange(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  async handleSubscriptionChange(subscription) {
    try {
      const { data: userSub, error } = await getSupabaseClient()
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (error) throw error;

      await this.saveSubscriptionToDatabase(userSub.user_id, subscription);
    } catch (error) {
      console.error('Error handling subscription change:', error);
      throw error;
    }
  }

  async handleSubscriptionCancellation(subscription) {
    try {
      const { data: userSub, error } = await getSupabaseClient()
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (error) throw error;

      await getSupabaseClient()
        .from('user_subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userSub.user_id);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(invoice) {
    try {
      const { data: userSub, error } = await getSupabaseClient()
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', invoice.subscription)
        .single();

      if (error) throw error;

      await this.savePaymentToDatabase(userSub.user_id, {
        id: invoice.payment_intent,
        invoice: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        payment_method_types: ['card'],
        description: `Payment for ${invoice.lines.data[0]?.description || 'subscription'}`
      });
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  async handlePaymentFailure(invoice) {
    try {
      const { data: userSub, error } = await getSupabaseClient()
        .from('user_subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', invoice.subscription)
        .single();

      if (error) throw error;

      await this.savePaymentToDatabase(userSub.user_id, {
        id: invoice.payment_intent,
        invoice: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        payment_method_types: ['card'],
        description: `Failed payment for ${invoice.lines.data[0]?.description || 'subscription'}`
      });
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;
