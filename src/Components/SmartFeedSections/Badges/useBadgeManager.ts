import { useState, useEffect } from 'react';

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

interface BadgeAchievement {
  id: string;
  level: number;
  name: string;
  icon: string;
  color: string;
  type: 'unlock' | 'levelup';
}

export const useBadgeManager = () => {
  const [badges, setBadges] = useState([
    {
      id: "swipe-master",
      name: "Swipe Master",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        { level: 1, name: "Swipe Novice", description: "Swipe on 10 jobs", requirement: 10, icon: "👆", color: "#FF6B6B", unlocked: false, currentProgress: 0 },
        { level: 2, name: "Swipe Apprentice", description: "Swipe on 50 jobs", requirement: 50, icon: "⚡", color: "#4ECDC4", unlocked: false, currentProgress: 0 },
        { level: 3, name: "Swipe Master", description: "Swipe on 100 jobs", requirement: 100, icon: "🔥", color: "#FF8C42", unlocked: false, currentProgress: 0 },
        { level: 4, name: "Swipe Legend", description: "Swipe on 500 jobs", requirement: 500, icon: "👑", color: "#DDA0DD", unlocked: false, currentProgress: 0 }
      ]
    },
    {
      id: "job-hunter",
      name: "Job Hunter",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        { level: 1, name: "Job Seeker", description: "Apply to 5 jobs", requirement: 5, icon: "🎯", color: "#45B7D1", unlocked: false, currentProgress: 0 },
        { level: 2, name: "Job Hunter", description: "Apply to 20 jobs", requirement: 20, icon: "🏹", color: "#96CEB4", unlocked: false, currentProgress: 0 },
        { level: 3, name: "Job Warrior", description: "Apply to 50 jobs", requirement: 50, icon: "⚔️", color: "#FFEAA7", unlocked: false, currentProgress: 0 }
      ]
    },
    {
      id: "offer-receiver",
      name: "Offer Receiver",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        { level: 1, name: "First Offer", description: "Receive your first job offer", requirement: 1, icon: "🏆", color: "#96CEB4", unlocked: false, currentProgress: 0 },
        { level: 2, name: "Offer Collector", description: "Receive 5 job offers", requirement: 5, icon: "💎", color: "#A8E6CF", unlocked: false, currentProgress: 0 }
      ]
    },
    {
      id: "premium-member",
      name: "Premium Member",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        { level: 1, name: "Premium Member", description: "Upgrade to premium", requirement: 1, icon: "💎", color: "#FFEAA7", unlocked: false, currentProgress: 0 }
      ]
    },
    {
      id: "profile-complete",
      name: "Profile Complete",
      currentLevel: 1,
      totalProgress: 85,
      levels: [
        { level: 1, name: "Profile Builder", description: "Complete 50% of your profile", requirement: 50, icon: "📝", color: "#DDA0DD", unlocked: true, currentProgress: 85 },
        { level: 2, name: "Profile Master", description: "Complete 100% of your profile", requirement: 100, icon: "✅", color: "#4CAF50", unlocked: false, currentProgress: 85 }
      ]
    },
    {
      id: "quick-applicant",
      name: "Quick Applicant",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        { level: 1, name: "Quick Applicant", description: "Apply to 5 jobs in one day", requirement: 5, icon: "🚀", color: "#FF8C42", unlocked: false, currentProgress: 0 },
        { level: 2, name: "Speed Demon", description: "Apply to 10 jobs in one day", requirement: 10, icon: "⚡", color: "#4ECDC4", unlocked: false, currentProgress: 0 },
        { level: 3, name: "Application Master", description: "Apply to 20 jobs in one day", requirement: 20, icon: "🏆", color: "#96CEB4", unlocked: false, currentProgress: 0 }
      ]
    },
    {
      id: "daily-login",
      name: "Daily Login",
      currentLevel: 1,
      totalProgress: 3,
      levels: [
        { level: 1, name: "Daily Helper", description: "Login for 3 consecutive days", requirement: 3, icon: "📅", color: "#A8E6CF", unlocked: true, currentProgress: 3 },
        { level: 2, name: "Weekly Warrior", description: "Login for 7 consecutive days", requirement: 7, icon: "📊", color: "#FF6B6B", unlocked: false, currentProgress: 3 },
        { level: 3, name: "Monthly Master", description: "Login for 30 consecutive days", requirement: 30, icon: "🎯", color: "#DDA0DD", unlocked: false, currentProgress: 3 }
      ]
    },
    {
      id: "feedback-giver",
      name: "Feedback Giver",
      currentLevel: 1,
      totalProgress: 0,
      levels: [
        { level: 1, name: "Feedback Giver", description: "Provide feedback to the developers", requirement: 1, icon: "💬", color: "#FFB347", unlocked: false, currentProgress: 0 }
      ]
    }
  ]);

  // Track badge achievements for notifications
  const [badgeAchievements, setBadgeAchievements] = useState<BadgeAchievement[]>([]);

  // Current achievement being shown
  const [currentAchievement, setCurrentAchievement] = useState<BadgeAchievement | null>(null);

  // Helper to update badge progress
  const updateBadgeProgress = (badgeId: string, increment = 1) => {
    setBadges(prev => {
      const oldBadge = prev.find(b => b.id === badgeId);
      if (!oldBadge) return prev;
      
      const newTotalProgress = oldBadge.totalProgress + increment;
      
      // Update levels based on total progress
      const newLevels = oldBadge.levels.map((level, idx) => {
        const shouldUnlock = newTotalProgress >= level.requirement;
        return {
          ...level,
          unlocked: shouldUnlock,
          currentProgress: newTotalProgress
        };
      });
      
      // Update current level to the highest unlocked level
      const highestUnlockedLevel = newLevels
        .filter(level => level.unlocked)
        .reduce((highest, current) => current.level > highest.level ? current : highest, newLevels[0]);
      
      // If at max level, cap progress at max requirement
      const maxLevel = newLevels[newLevels.length - 1];
      const cappedProgress = newTotalProgress > maxLevel.requirement ? maxLevel.requirement : newTotalProgress;
      
      const newBadge = {
        ...oldBadge,
        totalProgress: cappedProgress,
        levels: newLevels,
        currentLevel: highestUnlockedLevel ? highestUnlockedLevel.level : 1
      };
      
      // Check for new achievements
      const newAchievements: BadgeAchievement[] = [];
      
      newLevels.forEach(level => {
        const oldLevel = oldBadge.levels.find(l => l.level === level.level);
        if (level.unlocked && (!oldLevel || !oldLevel.unlocked)) {
          // New unlock
          newAchievements.push({
            id: badgeId,
            level: level.level,
            name: level.name,
            icon: level.icon,
            color: level.color,
            type: 'unlock'
          });
        }
      });
      
      // Check for level ups (current level increased)
      if (newBadge.currentLevel > oldBadge.currentLevel) {
        const levelUpLevel = newLevels.find(l => l.level === newBadge.currentLevel);
        if (levelUpLevel) {
          newAchievements.push({
            id: badgeId,
            level: levelUpLevel.level,
            name: levelUpLevel.name,
            icon: levelUpLevel.icon,
            color: levelUpLevel.color,
            type: 'levelup'
          });
        }
      }
      
      // Add new achievements to the queue (only if not already queued)
      if (newAchievements.length > 0) {
        setBadgeAchievements(prev => {
          // Prevent duplicate notifications
          const ids = new Set(prev.map(a => a.id + '-' + a.level + '-' + a.type));
          return [...prev, ...newAchievements.filter(a => !ids.has(a.id + '-' + a.level + '-' + a.type))];
        });
      }
      
      return prev.map(b => b.id === badgeId ? newBadge : b);
    });
  };

  // Handle showing badge achievements
  const showNextAchievement = () => {
    if (badgeAchievements.length > 0) {
      const nextAchievement = badgeAchievements[0];
      setCurrentAchievement(nextAchievement);
      setBadgeAchievements(prev => prev.slice(1));
    } else {
      setCurrentAchievement(null);
    }
  };

  const closeAchievement = () => {
    setCurrentAchievement(null);
    // Show next achievement if there are more
    setTimeout(() => {
      showNextAchievement();
    }, 500);
  };

  const viewBadges = (goToFilters: () => void) => {
    goToFilters();
    setCurrentAchievement(null);
    // Show next achievement if there are more
    setTimeout(() => {
      showNextAchievement();
    }, 500);
  };

  // Show achievements when they're added
  useEffect(() => {
    if (badgeAchievements.length > 0 && !currentAchievement) {
      showNextAchievement();
    }
  }, [badgeAchievements, currentAchievement]);

  return {
    badges,
    currentAchievement,
    updateBadgeProgress,
    closeAchievement,
    viewBadges
  };
}; 