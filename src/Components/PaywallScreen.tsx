import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiTrendingUp, FiUsers, FiShield, FiStar, FiArrowRight } from 'react-icons/fi';
import { paymentService } from '../services/paymentService';
import { supabase } from '../supabaseClient';

interface PaywallScreenProps {
  onComplete: () => void;
  onBack?: () => void;
  userId: string;
  userEmail: string;
}

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id: string;
  features: string[];
}

const PaywallScreen: React.FC<PaywallScreenProps> = ({ onComplete, onBack, userId, userEmail }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await paymentService.getSubscriptionPlans();
      setPlans(plansData);
      if (plansData.length > 0) {
        setSelectedPlan(plansData[0].stripe_price_id);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      // Set default plans if API fails
      setPlans([
        {
          id: '1',
          name: 'Basic',
          price_monthly: 9.99,
          price_yearly: 99.99,
          stripe_price_id: 'basic_monthly',
          features: ['Up to 50 job applications per month', 'Basic job matching', 'Email support']
        },
        {
          id: '2',
          name: 'Professional',
          price_monthly: 19.99,
          price_yearly: 199.99,
          stripe_price_id: 'pro_monthly',
          features: ['Unlimited job applications', 'Advanced job matching', 'Priority support']
        }
      ]);
      setSelectedPlan('basic_monthly');
    }
  };

  const handleStartTrial = async () => {
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const selectedPlanData = plans.find(plan => plan.stripe_price_id === selectedPlan);
      if (!selectedPlanData) {
        throw new Error('Selected plan not found');
      }

      const response = await fetch('/api/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userEmail,
          planId: selectedPlanData.id,
          billingCycle,
          stripePriceId: selectedPlanData.stripe_price_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start trial');
      }

      setProgress(100);
      setTimeout(() => {
        onComplete();
      }, 500);

    } catch (error) {
      console.error('Error starting trial:', error);
      setError(error instanceof Error ? error.message : 'Failed to start trial');
    } finally {
      setLoading(false);
    }
  };

  const calculateSavings = (plan: Plan) => {
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyPrice = plan.price_yearly;
    return monthlyTotal - yearlyPrice;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-blue-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 py-8">
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Start Your{' '}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                2-Day Free Trial
              </span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
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
            className="grid grid-cols-1 gap-6 mb-8"
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

                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name} Plan</h3>
                                     <div className="mb-4">
                     <span className="text-2xl font-bold text-gray-900">
                       ${billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly}
                     </span>
                     <span className="text-gray-600 ml-2 text-sm">
                       /{billingCycle === 'monthly' ? 'mo' : 'year'}
                     </span>
                   </div>
                                     {billingCycle === 'yearly' && (
                     <div className="text-green-600 text-xs font-semibold">
                       Save ${calculateSavings(plan).toFixed(2)} per year
                     </div>
                   )}
                </div>

                                 <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                                             <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-sm border mb-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              What You'll Get During Your Free Trial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                   <h4 className="font-semibold text-gray-900 mb-1 text-sm">{feature.title}</h4>
                 <p className="text-gray-600 text-xs">{feature.description}</p>
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

            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                              <div className="flex items-center justify-center space-x-3 mb-3">
                <FiStar className="w-6 h-6 text-yellow-500" />
                <span className="text-base font-semibold text-gray-900">
                  Start your 2-day free trial today
                </span>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                No credit card required • Cancel anytime • Full access to all features
              </p>
              
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-base hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
    </div>
  );
};

export default PaywallScreen;
