import React, { useState } from "react";

interface BadgeLevel {
  level: number;
  name: string;
  description: string;
  requirement: number;
  icon: string;
  color: string;
  unlocked: boolean;
  currentProgress?: number;
}

interface Badge {
  id: string;
  name: string;
  levels: BadgeLevel[];
  currentLevel: number;
  totalProgress: number;
}

interface BadgesSectionProps {
  badges?: Badge[];
}

const BadgesSection: React.FC<BadgesSectionProps> = ({ badges = [] }) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Default badges with levels if none provided
  const defaultBadges: Badge[] = [
    {
      id: "swipe-master",
      name: "Swipe Master",
      currentLevel: 1,
      totalProgress: 23,
      levels: [
        {
          level: 1,
          name: "Swipe Novice",
          description: "Swipe on 10 jobs",
          requirement: 10,
          icon: "👆",
          color: "#FF6B6B",
          unlocked: true,
          currentProgress: 23
        },
        {
          level: 2,
          name: "Swipe Apprentice",
          description: "Swipe on 50 jobs",
          requirement: 50,
          icon: "⚡",
          color: "#4ECDC4",
          unlocked: false,
          currentProgress: 23
        },
        {
          level: 3,
          name: "Swipe Master",
          description: "Swipe on 100 jobs",
          requirement: 100,
          icon: "🔥",
          color: "#FF8C42",
          unlocked: false,
          currentProgress: 23
        },
        {
          level: 4,
          name: "Swipe Legend",
          description: "Swipe on 500 jobs",
          requirement: 500,
          icon: "👑",
          color: "#DDA0DD",
          unlocked: false,
          currentProgress: 23
        }
      ]
    },
    {
      id: "job-hunter",
      name: "Job Hunter",
      currentLevel: 1,
      totalProgress: 3,
      levels: [
        {
          level: 1,
          name: "Job Seeker",
          description: "Apply to 5 jobs",
          requirement: 5,
          icon: "🎯",
          color: "#45B7D1",
          unlocked: false,
          currentProgress: 3
        },
        {
          level: 2,
          name: "Job Hunter",
          description: "Apply to 20 jobs",
          requirement: 20,
          icon: "🏹",
          color: "#96CEB4",
          unlocked: false,
          currentProgress: 3
        },
        {
          level: 3,
          name: "Job Warrior",
          description: "Apply to 50 jobs",
          requirement: 50,
          icon: "⚔️",
          color: "#FFEAA7",
          unlocked: false,
          currentProgress: 3
        }
      ]
    },
    {
      id: "offer-receiver",
      name: "Offer Receiver",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        {
          level: 1,
          name: "First Offer",
          description: "Receive your first job offer",
          requirement: 1,
          icon: "🏆",
          color: "#96CEB4",
          unlocked: false,
          currentProgress: 0
        },
        {
          level: 2,
          name: "Offer Collector",
          description: "Receive 5 job offers",
          requirement: 5,
          icon: "💎",
          color: "#A8E6CF",
          unlocked: false,
          currentProgress: 0
        }
      ]
    },
    {
      id: "premium-member",
      name: "Premium Member",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        {
          level: 1,
          name: "Premium Member",
          description: "Upgrade to premium",
          requirement: 1,
          icon: "💎",
          color: "#FFEAA7",
          unlocked: false,
          currentProgress: 0
        }
      ]
    },
    {
      id: "profile-complete",
      name: "Profile Complete",
      currentLevel: 1,
      totalProgress: 85,
      levels: [
        {
          level: 1,
          name: "Profile Builder",
          description: "Complete 50% of your profile",
          requirement: 50,
          icon: "📝",
          color: "#DDA0DD",
          unlocked: true,
          currentProgress: 85
        },
        {
          level: 2,
          name: "Profile Master",
          description: "Complete 100% of your profile",
          requirement: 100,
          icon: "✅",
          color: "#4CAF50",
          unlocked: false,
          currentProgress: 85
        }
      ]
    },
    {
      id: "quick-applicant",
      name: "Quick Applicant",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        {
          level: 1,
          name: "Quick Applicant",
          description: "Apply to 5 jobs in one day",
          requirement: 5,
          icon: "🚀",
          color: "#FF8C42",
          unlocked: false,
          currentProgress: 0
        },
        {
          level: 2,
          name: "Speed Demon",
          description: "Apply to 10 jobs in one day",
          requirement: 10,
          icon: "⚡",
          color: "#4ECDC4",
          unlocked: false,
          currentProgress: 0
        },
        {
          level: 3,
          name: "Application Master",
          description: "Apply to 20 jobs in one day",
          requirement: 20,
          icon: "🏆",
          color: "#96CEB4",
          unlocked: false,
          currentProgress: 0
        }
      ]
    },
    {
      id: "daily-login",
      name: "Daily Login",
      currentLevel: 1,
      totalProgress: 7,
      levels: [
        {
          level: 1,
          name: "Daily Helper",
          description: "Login for 7 consecutive days",
          requirement: 7,
          icon: "📅",
          color: "#A8E6CF",
          unlocked: true,
          currentProgress: 7
        },
        {
          level: 2,
          name: "Weekly Warrior",
          description: "Login for 30 consecutive days",
          requirement: 30,
          icon: "📊",
          color: "#FF6B6B",
          unlocked: false,
          currentProgress: 7
        },
        {
          level: 3,
          name: "Monthly Master",
          description: "Login for 100 consecutive days",
          requirement: 100,
          icon: "🎯",
          color: "#DDA0DD",
          unlocked: false,
          currentProgress: 7
        }
      ]
    },
    {
      id: "feedback-giver",
      name: "Feedback Giver",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        {
          level: 1,
          name: "Feedback Giver",
          description: "Provide feedback to the developers",
          requirement: 1,
          icon: "💬",
          color: "#FFB347",
          unlocked: false,
          currentProgress: 0
        }
      ]
    }
  ];

  const displayBadges = badges.length > 0 ? badges : defaultBadges;

  const handleBadgeClick = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };

  const closeBadgeModal = () => {
    setShowBadgeModal(false);
    setSelectedBadge(null);
  };

  const getCurrentLevel = (badge: Badge) => {
    return badge.levels.find(level => level.unlocked) || badge.levels[0];
  };

  const getNextLevel = (badge: Badge) => {
    const currentLevel = getCurrentLevel(badge);
    const currentIndex = badge.levels.findIndex(level => level.level === currentLevel.level);
    return badge.levels[currentIndex + 1];
  };

  const getNextLevelToUnlock = (badge: Badge) => {
    // Find the first locked level, or the next level after the highest unlocked one
    const unlockedLevels = badge.levels.filter(level => level.unlocked);
    if (unlockedLevels.length === 0) {
      // No levels unlocked, show the first level as the goal
      return badge.levels[0];
    }
    
    const highestUnlockedLevel = unlockedLevels.reduce((highest, current) => 
      current.level > highest.level ? current : highest
    );
    
    const nextLevel = badge.levels.find(level => level.level === highestUnlockedLevel.level + 1);
    return nextLevel || null;
  };

  const getDisplayLevel = (badge: Badge) => {
    const hasUnlockedLevel = badge.levels.some(level => level.unlocked);
    if (hasUnlockedLevel) {
      // If any level is unlocked, show the highest unlocked level
      return badge.levels.filter(level => level.unlocked).reduce((highest, current) => 
        current.level > highest.level ? current : highest
      );
    } else {
      // If no levels are unlocked, show the first level as the goal
      return badge.levels[0];
    }
  };

  const getProgressForDisplay = (badge: Badge) => {
    const nextLevelToUnlock = getNextLevelToUnlock(badge);
    if (!nextLevelToUnlock) {
      // At max level
      const maxLevel = badge.levels[badge.levels.length - 1];
      return {
        current: maxLevel.requirement,
        total: maxLevel.requirement
      };
    }
    // Use the total progress towards the next level to unlock
    return {
      current: Math.min(badge.totalProgress, nextLevelToUnlock.requirement),
      total: nextLevelToUnlock.requirement
    };
  };

  return (
    <div className="w-full bg-white rounded-[2rem] border-4 border-gray-300 p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[18px] font-bold text-[#5C1EE2]">Your Badges</h2>
        <div className="text-sm text-gray-500">
          {displayBadges.filter(b => getCurrentLevel(b).unlocked).length}/{displayBadges.length} unlocked
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-hide py-2 smartfeed-scroll" style={{ touchAction: 'pan-x', minHeight: '140px', overflowY: 'hidden' }}>
        <div className="flex flex-row gap-x-4 pl-2 pt-2" style={{ minWidth: 'max-content', paddingBottom: '16px' }}>
          {displayBadges.map((badge) => {
            const displayLevel = getDisplayLevel(badge);
            const hasUnlockedLevel = badge.levels.some(level => level.unlocked);
            
            return (
              <div
                key={badge.id}
                onClick={() => handleBadgeClick(badge)}
                className={`flex-shrink-0 w-[140px] h-[140px] p-3 rounded-[20px] outline outline-[3px] flex flex-col items-center justify-center gap-2 relative cursor-pointer transition-transform hover:scale-105 overflow-hidden ${
                  hasUnlockedLevel
                    ? 'bg-gradient-to-br from-gray-50 to-gray-100 outline-[#4CAF50]' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 outline-[#E0E0E0]'
                }`}
              >
                {/* Badge Icon */}
                <div className="w-[64px] h-[64px] flex items-center justify-center overflow-hidden leading-none mb-2">
                  <span
                    className={`text-5xl ${hasUnlockedLevel ? 'opacity-100' : 'opacity-30'}`}
                    style={{ color: hasUnlockedLevel ? displayLevel.color : '#999', display: 'block' }}
                  >
                    {displayLevel.icon}
                  </span>
                </div>
                
                {/* Badge Name */}
                <div className={`text-center text-sm font-bold leading-tight break-words ${
                  hasUnlockedLevel ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {displayLevel.name}
                </div>
                
                {/* Lock Icon for completely locked badges */}
                {!hasUnlockedLevel && (
                  <div className="absolute top-2 right-2 text-gray-400 text-sm">
                    🔒
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {showBadgeModal && selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[25px] p-4 max-w-xs w-full max-h-[70vh] flex flex-col">
            <div className="flex justify-end mb-3">
              <button 
                onClick={closeBadgeModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            {/* Current Level or Next Goal - Prominently displayed at top */}
            {(() => {
              const hasUnlockedLevel = selectedBadge.levels.some(level => level.unlocked);
              const nextLevelToUnlock = getNextLevelToUnlock(selectedBadge);
              const atMaxLevel = !nextLevelToUnlock;
              const displayLevel = atMaxLevel
                ? selectedBadge.levels[selectedBadge.levels.length - 1]
                : nextLevelToUnlock;
              const progress = getProgressForDisplay(selectedBadge);
              return (
                <div className="mb-4 p-6 bg-white rounded-[20px]">
                  <div className="flex flex-col items-center text-center">
                    <div 
                      className="text-6xl mb-4"
                      style={{ color: displayLevel.color }}
                    >
                      {displayLevel.icon}
                    </div>
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-gray-800 mb-2">
                        {atMaxLevel ? displayLevel.name : `Next: ${displayLevel.name}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {displayLevel.description}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      atMaxLevel 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}>
                      {atMaxLevel ? 'Unlocked' : 'Locked'}
                    </div>
                    {/* Progress bar for next level to unlock */}
                      <div className="w-full mt-4">
                        <div className="flex justify-between text-xs text-[#5C1EE2] mb-1 font-semibold">
                          <span>Progress</span>
                          <span>{progress.current}/{progress.total}</span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-1.5">
                          <div 
                            className="bg-[#5C1EE2] h-1.5 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min((progress.current / progress.total) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgesSection; 