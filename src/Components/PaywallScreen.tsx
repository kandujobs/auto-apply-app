import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiStar, FiZap, FiUsers, FiTrendingUp, FiShield, FiArrowRight } from 'react-icons/fi';
import { paymentService, SubscriptionPlan } from '../services/paymentService';
import { supabase } from '../supabaseClient';

interface PaywallScreenProps {
  onComplete: () => void;
  onBack?: () => void;
  userId: string;
  userEmail: string;
}

const PaywallScreen: React.FC<PaywallScreenProps> = ({ onComplete, onBack, userId, userEmail }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('price_1RxSRoFdjOQFWIuB3KWl6Sx5'); // Default to Starter
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const subscriptionPlans = await paymentService.getSubscriptionPlans();
      setPlans(subscriptionPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      setError('Failed to load subscription plans');
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const selectedPlanData = getSelectedPlan();
      
      if (!selectedPlanData) {
        throw new Error('Selected plan not found');
      }

      // If it's the free tier, just create a free trial record
      if (selectedPlanData.price_monthly === 0) {
        setProgress(50);
        await paymentService.createFreeTrial(userId, 2);
        setProgress(100);
        
        setTimeout(() => {
          onComplete();
        }, 1000);
        return;
      }

      // For paid plans, create Stripe customer and subscription
      setProgress(20);
      const customer = await paymentService.createCustomer(userEmail);
      setProgress(40);

      // Get the correct price ID based on billing cycle
      const priceId = billingCycle === 'yearly' 
        ? plans.find(p => p.name === `${selectedPlanData.name} Yearly`)?.stripe_price_id
        : selectedPlan;

      if (!priceId) {
        throw new Error('Price ID not found for selected plan');
      }

      // Create subscription with trial
      const subscription = await paymentService.createSubscription(
        customer.id,
        priceId,
        userId,
        2 // 2-day trial
      );
      setProgress(80);

      // Create free trial record
      await paymentService.createFreeTrial(userId, 2);
      setProgress(100);

      // Success - redirect to main app
      setTimeout(() => {
        onComplete();
      }, 1000);

    } catch (error) {
      console.error('Error starting trial:', error);
      setError('Failed to start free trial. Please try again.');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlan = () => {
    return plans.find(plan => plan.stripe_price_id === selectedPlan);
  };

  const getPrice = () => {
    const plan = getSelectedPlan();
    if (!plan) return 0;
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  };

  const getSavings = () => {
    const plan = getSelectedPlan();
    if (!plan || billingCycle === 'monthly') return 0;
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyPrice = plan.price_yearly;
    return monthlyTotal - yearlyPrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto py-8">
        {/* Progress bar */}
        {loading && (
          <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Kandu
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Start Your{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              2-Day Free Trial
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock unlimited job applications, AI-powered auto-apply, and advanced job search features.
            No commitment required.
          </p>
        </motion.div>

        {/* Billing Cycle Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white rounded-2xl p-1 shadow-sm border">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {plans.filter(plan => plan.name !== 'Free' && !plan.name.includes('Yearly')).map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 transition-all cursor-pointer ${
                selectedPlan === plan.stripe_price_id
                  ? 'border-purple-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedPlan(plan.stripe_price_id)}
            >
              {plan.name === 'Professional' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              {plan.name === 'Starter' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Best Value
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {plan.price_monthly === 0 ? (
                    <span className="text-4xl font-bold text-green-600">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        {paymentService.formatPrice(
                          billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
                        )}
                      </span>
                      <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'year'}</span>
                    </>
                  )}
                </div>
                {billingCycle === 'yearly' && plan.price_monthly > 0 && (
                  <div className="text-green-600 text-sm font-semibold">
                    Save {paymentService.formatPrice(getSavings())} per year
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className={`w-4 h-4 rounded-full border-2 mx-auto ${
                  selectedPlan === plan.stripe_price_id
                    ? 'border-purple-500 bg-purple-500'
                    : 'border-gray-300'
                }`}>
                  {selectedPlan === plan.stripe_price_id && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-8 shadow-sm border mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What You'll Get During Your Free Trial
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <FiZap className="w-8 h-8" />,
                title: 'AI Auto-Apply',
                description: 'Automatically apply to jobs that match your profile'
              },
              {
                icon: <FiTrendingUp className="w-8 h-8" />,
                title: 'Smart Matching',
                description: 'AI-powered job recommendations based on your skills'
              },
              {
                icon: <FiUsers className="w-8 h-8" />,
                title: 'Unlimited Applications',
                description: 'Apply to as many jobs as you want without limits'
              },
              {
                icon: <FiShield className="w-8 h-8" />,
                title: 'Priority Support',
                description: 'Get help when you need it with priority support'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-purple-600 mb-3 flex justify-center">{feature.icon}</div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <FiStar className="w-6 h-6 text-yellow-500" />
              <span className="text-lg font-semibold text-gray-900">
                Start your 2-day free trial today
              </span>
            </div>
            <p className="text-gray-600 mb-6">
              No credit card required • Cancel anytime • Full access to all features
            </p>
            
            <button
              onClick={handleStartTrial}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Setting up your trial...</span>
                </>
              ) : (
                <>
                  <span>Start Free Trial</span>
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to setup
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};
};

export default PaywallScreen;
