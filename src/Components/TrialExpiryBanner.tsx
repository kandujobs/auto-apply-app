import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiClock, FiStar, FiArrowRight } from 'react-icons/fi';
import { paymentService } from '../services/paymentService';

interface TrialExpiryBannerProps {
  expiresAt: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
  isVisible: boolean;
}

const TrialExpiryBanner: React.FC<TrialExpiryBannerProps> = ({
  expiresAt,
  onUpgrade,
  onDismiss,
  isVisible
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const daysRemaining = paymentService.getTrialDaysRemaining(expiresAt);
  const isExpiringSoon = paymentService.isTrialExpiringSoon(expiresAt);
  const isExpired = daysRemaining === 0;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  const getBannerContent = () => {
    if (isExpired) {
      return {
        title: 'Your free trial has expired',
        message: 'Upgrade now to continue using all Kandu features and apply to unlimited jobs.',
        buttonText: 'Upgrade Now',
        icon: <FiAlertTriangle className="w-5 h-5" />,
        bgColor: 'bg-red-500',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      };
    } else if (isExpiringSoon) {
      return {
        title: 'Your free trial expires soon',
        message: `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left! Upgrade to keep your progress.`,
        buttonText: 'Upgrade Now',
        icon: <FiClock className="w-5 h-5" />,
        bgColor: 'bg-yellow-500',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800'
      };
    } else {
      return {
        title: 'Free trial active',
        message: `${daysRemaining} days remaining in your free trial.`,
        buttonText: 'Upgrade Early',
        icon: <FiStar className="w-5 h-5" />,
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800'
      };
    }
  };

  const content = getBannerContent();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-0 left-0 right-0 z-50 ${content.bgColor} ${content.borderColor} border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${content.textColor}`}>
                {content.icon}
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${content.textColor}`}>
                  {content.title}
                </h3>
                <p className={`text-xs ${content.textColor} opacity-90`}>
                  {content.message}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onUpgrade}
                className={`bg-white ${content.textColor} px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center space-x-2`}
              >
                <span>{content.buttonText}</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
              
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className={`${content.textColor} hover:opacity-70 transition-opacity`}
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrialExpiryBanner;
