import { loadStripe } from '@stripe/stripe-js';
import { backendUrl } from '../utils/backendUrl';

// Load Stripe with your publishable key
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

export interface SubscriptionPlan {
  id: string;
  name: string;
  stripe_price_id: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_job_applications: number | null;
  max_resume_uploads: number | null;
  auto_apply_enabled: boolean;
  priority_support: boolean;
  is_active: boolean;
}

export interface UserAccess {
  hasAccess: boolean;
  type: 'subscription' | 'trial' | null;
  data: any;
  expiresAt: string | null;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
}

export interface StripeSubscription {
  id: string;
  status: string;
  current_period_end: number;
  trial_end?: number;
  latest_invoice?: {
    payment_intent?: {
      client_secret: string;
    };
  };
}

class PaymentService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = backendUrl;
  }

  // Get subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payment/subscription-plans`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      const data = await response.json();
      return data.plans;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  // Create a Stripe customer
  async createCustomer(email: string, name?: string): Promise<StripeCustomer> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payment/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const data = await response.json();
      return data.customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  // Create a subscription
  async createSubscription(
    customerId: string,
    priceId: string,
    userId: string,
    trialDays: number = 2
  ): Promise<StripeSubscription> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payment/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          priceId,
          userId,
          trialDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      return data.subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Create a payment intent
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string
  ): Promise<PaymentIntent> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payment/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data.paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Check user access
  async checkUserAccess(userId: string): Promise<UserAccess> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payment/user-access/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to check user access');
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking user access:', error);
      throw error;
    }
  }

  // Create free trial
  async createFreeTrial(userId: string, trialDays: number = 2): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payment/create-free-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          trialDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create free trial');
      }

      const data = await response.json();
      return data.trial;
    } catch (error) {
      console.error('Error creating free trial:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<StripeSubscription> {
    try {
      const response = await fetch(`${this.backendUrl}/api/payment/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      return data.subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Get Stripe instance
  async getStripe() {
    return await stripePromise;
  }

  // Format price for display
  formatPrice(amount: number, currency: string = 'usd'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(amount / 100); // Convert cents to dollars
  }

  // Get trial days remaining
  getTrialDaysRemaining(expiresAt: string): number {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Check if trial is expiring soon (within 24 hours)
  isTrialExpiringSoon(expiresAt: string): boolean {
    const daysRemaining = this.getTrialDaysRemaining(expiresAt);
    return daysRemaining <= 1;
  }
}

export const paymentService = new PaymentService();
