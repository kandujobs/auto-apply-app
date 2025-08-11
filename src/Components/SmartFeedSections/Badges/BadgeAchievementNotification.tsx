import React, { useEffect } from 'react';

interface BadgeAchievement {
  id: string;
  level: number;
  name: string;
  icon: string;
  color: string;
  type: 'unlock' | 'levelup';
}

interface BadgeAchievementNotificationProps {
  achievement: BadgeAchievement;
  isVisible: boolean;
  onClose: () => void;
  onViewBadges: () => void;
}

export const BadgeAchievementNotification: React.FC<BadgeAchievementNotificationProps> = ({
  achievement,
  isVisible,
  onClose,
  onViewBadges
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Show for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-4 max-w-md mx-4">
        <div className="flex items-center gap-3">
          {/* Badge Icon */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${achievement.color}20` }}
          >
            <span style={{ color: achievement.color }}>
              {achievement.icon}
            </span>
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="font-bold text-gray-800 text-sm">
              {achievement.type === 'unlock' ? 'Badge Unlocked!' : 'Level Up!'}
            </div>
            <div className="text-gray-600 text-xs">
              {achievement.name}
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
        </div>
        
        {/* Action button */}
        <button
          onClick={onViewBadges}
          className="w-full mt-3 bg-purple-600 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:bg-purple-700 transition-colors"
        >
          View in Smart Feed
        </button>
      </div>
    </div>
  );
};

export default BadgeAchievementNotification; 