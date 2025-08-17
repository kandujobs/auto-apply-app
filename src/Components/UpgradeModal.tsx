import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiStar, FiZap, FiUsers, FiTrendingUp, FiShield, FiArrowRight } from 'react-icons/fi';
import { paymentService, SubscriptionPlan } from '../services/paymentService';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planId: string) => void;
  userId: string;
  userEmail: string;
  currentPlan?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  userId,
  userEmail,
  currentPlan
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('price_starter_monthly');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const subscriptionPlans = await paymentService.getSubscriptionPlans();
      setPlans(subscriptionPlans);
      // Set default selected plan (skip free trial)
      if (subscriptionPlans.length > 1) {
        setSelectedPlan(subscriptionPlans[1].stripe_price_id);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setError('Failed to load subscription plans');
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create or get customer
      const customer = await paymentService.createCustomer(userEmail);
      
      // Create subscription
      const subscription = await paymentService.createSubscription(
        customer.id,
        selectedPlan,
        userId,
        0 // No trial for upgrades
      );

      // Call the onUpgrade callback
      onUpgrade(selectedPlan);
      onClose();
    } catch (error) {
      console.error('Error upgrading:', error);
      setError('Failed to process upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlan = () => {
    return plans.find(plan => plan.stripe_price_id === selectedPlan);
  };

  const getSavings = () => {
    const plan = getSelectedPlan();
    if (!plan || billingCycle === 'monthly') return 0;
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyPrice = plan.price_yearly;
    return monthlyTotal - yearlyPrice;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">K</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
                  <p className="text-gray-600">Choose the perfect plan for your job search</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-xl p-1">
                <div className="flex">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all relative ${
                      billingCycle === 'yearly'
                        ? 'bg-white text-gray-900 shadow-sm'
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
            </div>
          </div>

          {/* Plans Grid */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {plans.slice(1).map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-xl p-6 border-2 transition-all cursor-pointer ${
                    selectedPlan === plan.stripe_price_id
                      ? 'border-purple-500 shadow-lg'
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {paymentService.formatPrice(
                          billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly
                        )}
                      </span>
                      <span className="text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'year'}</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="text-green-600 text-sm font-semibold">
                        Save {paymentService.formatPrice(getSavings())} per year
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
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
            </div>

            {/* Features Comparison */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                What's Included
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: <FiZap className="w-6 h-6" />,
                    title: 'AI Auto-Apply',
                    description: 'Automatically apply to matching jobs'
                  },
                  {
                    icon: <FiTrendingUp className="w-6 h-6" />,
                    title: 'Smart Matching',
                    description: 'AI-powered job recommendations'
                  },
                  {
                    icon: <FiUsers className="w-6 h-6" />,
                    title: 'Unlimited Applications',
                    description: 'No limits on job applications'
                  },
                  {
                    icon: <FiShield className="w-6 h-6" />,
                    title: 'Priority Support',
                    description: 'Get help when you need it'
                  }
                ].map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="text-purple-600 mb-2 flex justify-center">{feature.icon}</div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">{feature.title}</h4>
                    <p className="text-gray-600 text-xs">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Upgrade Now</span>
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <span>🔒 Secure Payment</span>
                <span>•</span>
                <span>Cancel Anytime</span>
                <span>•</span>
                <span>30-Day Money Back</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
