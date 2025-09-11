import React, { useEffect, useState } from "react";
import { supabase } from '../supabaseClient';
import LinkedInCredentialsSection from './LinkedInCredentialsSection';
import SessionManager from './SessionManager';
import { applyToLinkedInJob, validateAutoApplySetup, getUserProfile } from '../services/autoApplyBridge';

const packs = [
  {
    name: "Small Pack",
    credits: 10,
    jobs: 10,
    preview: "Choose 3 out of 10 jobs.",
    highlight: false,
    type: "small",
  },
  {
    name: "Large Pack",
    credits: 25,
    jobs: 25,
    preview: "Choose 8 out of 25 jobs.",
    highlight: true,
    type: "large",
  },
  {
    name: "Super Pack",
    credits: 50,
    jobs: 50,
    preview: "Choose 20 out of 50 jobs.",
    highlight: false,
    type: "super",
  },
];

const specializedPacks = [
  {
    name: "Internships Pack",
    credits: 15,
    preview: "Curated internships for you.",
  },
  {
    name: "Marketing Pack",
    credits: 20,
    preview: "Top marketing jobs.",
  },
  {
    name: "Design Pack",
    credits: 20,
    preview: "Best design opportunities.",
  },
];

const buyOptions = [
  { credits: 10, price: "$2.99" },
  { credits: 25, price: "$6.99" },
  { credits: 50, price: "$12.99" },
];

// Navigation props (use placeholder if not provided)
interface AutoApplyScreenProps {
  goToHome?: () => void;
  goToSaved?: () => void;
  goToApplied?: () => void;
  goToProfile?: () => void;
  goToFilters?: () => void;
  goToNotifications?: () => void;
  goToPaywall?: () => void;
}

const noop = () => {};

const AutoApplyScreen: React.FC<AutoApplyScreenProps> = ({
  goToHome = noop,
  goToSaved = noop,
  goToApplied = noop,
  goToProfile = noop,
  goToNotifications = noop,
  goToFilters = noop,
  goToPaywall = noop,
}) => {
  // Load from localStorage for instant UI, fallback to defaults
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('aa_streak')) || 0);
  const [loading, setLoading] = useState(true);
  const [claimedToday, setClaimedToday] = useState(() => localStorage.getItem('aa_claimedToday') === 'true');
  const [claiming, setClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // State for new fields
  const [electricAnim, setElectricAnim] = useState(false);
  const [blacklistTags, setBlacklistTags] = useState<string[]>([]);
  const [blacklistInput, setBlacklistInput] = useState('');

  // Remove consentGiven state
  const [notificationPref, setNotificationPref] = useState('immediate');
  const [showReview, setShowReview] = useState(false);
  const [autoAppliesUsed, setAutoAppliesUsed] = useState(() => Number(localStorage.getItem('aa_used')) || 0);
  const [usageDate, setUsageDate] = useState<string | null>(() => localStorage.getItem('aa_usageDate'));
  const [blacklistEditMode, setBlacklistEditMode] = useState(false);
  const [linkedInCredentials, setLinkedInCredentials] = useState<{ email: string; password: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Rewards array (7-day cycle with specific amounts)
  const rewards = [
    { desc: 'Day 1: You earned +2 extra applications today!', amount: 2 },
    { desc: 'Day 2: You earned +2 extra applications today!', amount: 2 },
    { desc: 'Day 3: You earned +3 extra applications today!', amount: 3 },
    { desc: 'Day 4: You earned +4 extra applications today!', amount: 4 },
    { desc: 'Day 5: You earned +5 extra applications today!', amount: 5 },
    { desc: 'Day 6: You earned +5 extra applications today!', amount: 5 },
    { desc: 'Day 7: 🎁 Special Gift! +10 extra applications today!', amount: 10 },
  ];
  // State for reward popup and dynamic limit
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [rewardMsg, setRewardMsg] = useState('');
  const [baseLimit] = useState(15); // base daily limit
  const [bonusLimit, setBonusLimit] = useState(0); // bonus from reward
  // Calculate today's reward index (cycle every 7 days)
  const rewardIndex = ((streak - 1) % 7 + 7) % 7;
  const todayReward = rewards[rewardIndex];

  // Live countdown for next reward
  const [nextRewardCountdown, setNextRewardCountdown] = useState(getTimeUntilMidnight());

  const fetchAndUpdateStreak = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }
      const userId = userData.user.id;
      // Fetch today's tracking record
      const today = new Date().toISOString().slice(0, 10);
      const { data: trackingRecord, error } = await supabase
        .from('user_daily_tracking')
        .select('login_streak, last_reward_claimed_date, reward_bonus_claimed')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching daily tracking record:', error);
        setLoading(false);
        return;
      }
      
      const currentStreak = trackingRecord?.login_streak || 0;
      const lastRewardClaimed = trackingRecord?.last_reward_claimed_date;
      let newStreak = currentStreak;
      let needsUpdate = false;
      
      // If no tracking record exists for today, this is a new day
      if (!trackingRecord) {
        // Check if we have a record for yesterday to determine streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        
        const { data: yesterdayRecord } = await supabase
          .from('user_daily_tracking')
          .select('login_streak')
          .eq('user_id', userId)
          .eq('date', yesterdayStr)
          .single();
        
        if (yesterdayRecord) {
          // Consecutive day - increment streak
          newStreak = (yesterdayRecord.login_streak || 0) + 1;
        } else {
          // First login or missed days - start streak at 1
          newStreak = 1;
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        // Create or update today's tracking record
        const { error: upsertError } = await supabase
          .from('user_daily_tracking')
          .upsert({
            user_id: userId,
            date: today,
            login_streak: newStreak
          }, { onConflict: 'user_id,date' });
        
        if (upsertError) {
          console.error('Error updating daily tracking record:', upsertError);
        }
      }
      setStreak(newStreak);
      localStorage.setItem('aa_streak', String(newStreak));
      // Check if reward claimed today - use reward_bonus_claimed > 0 as the indicator
      const claimed = trackingRecord && trackingRecord.reward_bonus_claimed > 0;
      console.log('fetchAndUpdateStreak - trackingRecord:', trackingRecord);
      console.log('fetchAndUpdateStreak - claimed:', claimed);
      console.log('fetchAndUpdateStreak - reward_bonus_claimed:', trackingRecord?.reward_bonus_claimed);
      setClaimedToday(!!claimed);
      localStorage.setItem('aa_claimedToday', String(!!claimed));
      
      // Load reward bonus from database if reward was claimed today
      if (claimed && trackingRecord?.reward_bonus_claimed) {
        setBonusLimit(trackingRecord.reward_bonus_claimed);
        console.log('Loaded reward bonus from database:', trackingRecord.reward_bonus_claimed);
      } else {
        setBonusLimit(0);
      }
      
      setLoading(false);
    };

  useEffect(() => {
    fetchAndUpdateStreak();
  }, []);

  useEffect(() => {
    if (claimedToday) {
      const interval = setInterval(() => {
        setNextRewardCountdown(getTimeUntilMidnight());
      }, 1000 * 60); // update every minute
      setNextRewardCountdown(getTimeUntilMidnight());
      return () => clearInterval(interval);
    }
  }, [claimedToday]);

  // Reset bonus at midnight
  useEffect(() => {
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime() - now.getTime();
    const timeout = setTimeout(() => setBonusLimit(0), msToMidnight);
    return () => clearTimeout(timeout);
  }, [bonusLimit, claimedToday]);

  // Fetch auto-apply usage on mount and when bonusLimit changes
  useEffect(() => {
    async function fetchUsage() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const userId = userData.user.id;
      const today = new Date().toISOString().slice(0, 10);
      
      // Get today's tracking record
      const { data: trackingRecord, error } = await supabase
        .from('user_daily_tracking')
        .select('auto_applies_used_today, auto_apply_usage_date')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching daily tracking record:', error);
        return;
      }
      
      if (trackingRecord) {
        setAutoAppliesUsed(trackingRecord.auto_applies_used_today || 0);
        setUsageDate(trackingRecord.auto_apply_usage_date || today);
        localStorage.setItem('aa_used', String(trackingRecord.auto_applies_used_today || 0));
        localStorage.setItem('aa_usageDate', trackingRecord.auto_apply_usage_date || today);
      } else {
        // No record for today, reset to 0
        setAutoAppliesUsed(0);
        setUsageDate(today);
        localStorage.setItem('aa_used', '0');
        localStorage.setItem('aa_usageDate', today);
      }
    }
    fetchUsage();
  }, [bonusLimit]);



  // Update application limit to include bonus
  const applicationLimit = baseLimit + bonusLimit;

  // On claim, show popup and increase limit
  const handleClaimReward = async () => {
    setClaiming(true);
    setShowSuccess(false);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setClaiming(false);
      return;
    }
    const userId = userData.user.id;
    const today = new Date().toISOString().slice(0, 10);
    
    // Check if reward was already claimed today
    const { data: existingRecord, error: checkError } = await supabase
      .from('user_daily_tracking')
      .select('reward_bonus_claimed')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing reward claim:', checkError);
      setClaiming(false);
      return;
    }
    
    // If reward was already claimed today, don't allow another claim
    console.log('handleClaimReward - existingRecord:', existingRecord);
    console.log('handleClaimReward - reward_bonus_claimed:', existingRecord?.reward_bonus_claimed);
    if (existingRecord && existingRecord.reward_bonus_claimed > 0) {
      console.log('Reward already claimed today, preventing duplicate claim');
      setClaiming(false);
      return;
    }
    
    // Update today's tracking record with reward claim
    const { error: upsertError } = await supabase
      .from('user_daily_tracking')
      .upsert({
        user_id: userId,
        date: today,
        last_reward_claimed_date: today,
        reward_bonus_claimed: todayReward.amount
      }, { onConflict: 'user_id,date' });
    
    if (upsertError) {
      console.error('Error claiming reward:', upsertError);
      setClaiming(false);
      return;
    }
    setClaimedToday(true);
    setClaiming(false);
    setShowSuccess(true);
    setRewardMsg(todayReward.desc);
    setShowRewardPopup(true);
    setBonusLimit(todayReward.amount);
    setTimeout(() => setShowSuccess(false), 2000);
    
    // Refresh the data to ensure consistency
    setTimeout(async () => {
      await fetchAndUpdateStreak();
    }, 100);
    // Optionally reset usage if new day
    const todayStr = new Date().toISOString().slice(0, 10);
    if (userData && userData.user) {
      await supabase.from('profiles').update({ auto_applies_used_today: 0, auto_apply_usage_date: todayStr }).eq('id', userData.user.id);
      setAutoAppliesUsed(0);
      setUsageDate(todayStr);
      localStorage.setItem('aa_used', '0');
      localStorage.setItem('aa_usageDate', todayStr);
    }
    // Dispatch event to refresh usage count in other components
    window.dispatchEvent(new CustomEvent('refreshUsageCount'));
  };

  // Helper to calculate time until next reward (midnight)
  function getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}h ${minutes}m`;
  }

  // Theme border color for enabled state
  const themeBorder = 'border-[#984DE0]';
  const themeShadow = 'shadow-lg';
  const themeBg = 'bg-white';
  const electricClass = electricAnim ? 'animate-electric-glow' : '';

  const handleCredentialsSaved = (credentials: { email: string; password: string }) => {
    setLinkedInCredentials(credentials);
  };

  const handleCredentialsDeleted = () => {
    setLinkedInCredentials(null);
  };

  const handleTestAutoApply = async () => {
    try {
      setValidationError(null);
      
      // Validate setup first
      const validation = await validateAutoApplySetup();
      if (!validation.ready) {
        let errorMessage = '❌ Auto-apply setup incomplete:\n';
        errorMessage += validation.missing.join('\n');
        
        errorMessage += '\nPlease complete your profile information to use auto-apply.';
        setValidationError(errorMessage);
        return;
      }

      // Get real user profile data
      const userProfile = await getUserProfile();
      if (!userProfile) {
        setValidationError('❌ Failed to load user profile data. Please check your profile information in Account Settings.');
        return;
      }

      // Test with a sample job URL
      const testJobUrl = 'https://www.linkedin.com/jobs/view/123456789';

      console.log('Testing auto-apply with job URL:', testJobUrl);
      console.log('Using real user profile:', userProfile);
      
      // Show loading state
      setValidationError('🔄 Testing auto-apply system... This may take a few moments.');
      
      const result = await applyToLinkedInJob(testJobUrl, userProfile);
      
      if (result.success) {
        setValidationError(`✅ Successfully applied to ${result.jobTitle} at ${result.company}!\n\nApplication ID: ${result.applicationId}\nJob ID: ${result.jobId}`);
      } else {
        setValidationError(`❌ Failed to apply: ${result.error}\n\nPlease check your LinkedIn credentials and try again.`);
      }
    } catch (error) {
      console.error('Error testing auto-apply:', error);
      setValidationError('❌ An error occurred while testing auto-apply. Please check that the backend server is running and try again.');
    }
  };



  // Persist to localStorage when these change
  useEffect(() => { localStorage.setItem('aa_used', String(autoAppliesUsed)); }, [autoAppliesUsed]);
  useEffect(() => { if (usageDate) localStorage.setItem('aa_usageDate', usageDate); }, [usageDate]);
  useEffect(() => { localStorage.setItem('aa_streak', String(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem('aa_claimedToday', String(claimedToday)); }, [claimedToday]);



  return (
    <div className="bg-gray-100 pt-40 pb-40 px-4 h-[calc(100vh-8rem)] overflow-y-auto">
      {/* Top Nav Gradient Bar */}
      <div className="fixed top-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] p-4 rounded-b-[2rem] z-20 flex items-center justify-center shadow-lg">
        <div className="mt-6 bg-white/100 rounded-3xl flex justify-center items-center px-8 py-2 gap-8 w-fit border-2 border-gray-400">
          <button onClick={goToNotifications} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="35" height="35">
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M4.51555 7C3.55827 8.4301 3 10.1499 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3V6M12 12L8 8" stroke="#878787" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>
              </g>
            </svg>
          </button>
          <button onClick={goToProfile} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#878787" strokeWidth="1.896" width="35" height="35">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <g id="style=linear">
                  <g id="profile">
                    <path id="vector" d="M12 11C14.4853 11 16.5 8.98528 16.5 6.5C16.5 4.01472 14.4853 2 12 2C9.51472 2 7.5 4.01472 7.5 6.5C7.5 8.98528 9.51472 11 12 11Z" stroke="#878787" strokeWidth="1.896" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path id="rec" d="M5 18.5714C5 16.0467 7.0467 14 9.57143 14H14.4286C16.9533 14 19 16.0467 19 18.5714C19 20.465 17.465 22 15.5714 22H8.42857C6.53502 22 5 20.465 5 18.5714Z" stroke="#878787" strokeWidth="1.896"></path>
                  </g>
                </g>
              </g>
            </svg>
          </button>
          <button onClick={goToHome} className="text-white text-[30px]">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#878787" width="35" height="35">
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M10.5026 5.01692L9.96661 3.65785C9.62068 2.78072 8.37933 2.78072 8.03339 3.65784L6.96137 6.37599C6.85576 6.64378 6.64378 6.85575 6.37599 6.96137L3.65785 8.03339C2.78072 8.37932 2.78072 9.62067 3.65784 9.96661L6.37599 11.0386C6.64378 11.1442 6.85575 11.3562 6.96137 11.624L8.03339 14.3422C8.37932 15.2193 9.62067 15.2193 9.96661 14.3422L11.0386 11.624C11.1442 11.3562 11.3562 11.1442 11.624 11.0386L14.3422 9.96661C15.2193 9.62068 15.2193 8.37933 14.3422 8.03339L12.9831 7.49738" stroke="#878787" strokeWidth="1.92" strokeLinecap="round"></path>
                <path d="M16.4885 13.3481C16.6715 12.884 17.3285 12.884 17.5115 13.3481L18.3121 15.3781C18.368 15.5198 18.4802 15.632 18.6219 15.6879L20.6519 16.4885C21.116 16.6715 21.116 17.3285 20.6519 17.5115L18.6219 18.3121C18.4802 18.368 18.368 18.4802 18.3121 18.6219L17.5115 20.6519C17.3285 21.116 16.6715 21.116 16.4885 20.6519L15.6879 18.6219C15.632 18.4802 15.5198 18.368 15.3781 18.3121L13.3481 17.5115C12.884 17.3285 12.884 16.6715 13.3481 16.4885L15.3781 15.6879C15.5198 15.632 15.632 15.5198 15.6879 15.3781L16.4885 13.3481Z" stroke="#878787" strokeWidth="1.92"></path>
              </g>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="w-full max-w-lg mx-auto flex flex-col gap-y-8 items-center justify-center pb-32 overflow-y-auto">
        {/* Application Session Card */}
        <div className={`w-full ${themeBg} rounded-3xl ${themeShadow} border-4 ${themeBorder} ${electricClass} p-6`}>
          <SessionManager 
            onSessionChange={(session) => setIsSessionActive(session.isActive)} 
            onShowPaywall={goToPaywall}
            onSessionStarted={() => {
              console.log('[AutoApplyScreen] Session started');
            }}
          />
        </div>
        
        {/* Daily Login Rewards Card */}
        <div className={`w-full ${themeBg} rounded-3xl ${themeShadow} border-4 ${themeBorder} ${electricClass} p-6 flex flex-col items-center`}>
          <div className="font-bold text-lg text-gray-700 mb-2">
            {!claimedToday ? 'Daily Reward!' : `Next Reward in ${nextRewardCountdown}`}
          </div>
          <div className="relative w-full mt-2 mb-2">
            {/* Scrollable container with fade effects */}
            <div className="flex flex-row gap-2 justify-center items-center overflow-hidden">
              {/* Left fade gradient */}
              <div className="absolute left-0 top-0 w-4 h-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
              
              {/* Right fade gradient */}
              <div className="absolute right-0 top-0 w-4 h-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
              
              {/* Scrollable content */}
              <div className="flex flex-row gap-2 justify-center items-center px-4 overflow-x-auto scrollbar-hide">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${i < streak ? 'bg-gradient-to-br from-[#984DE0] to-[#7300FF] border-[#984DE0] text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
                  >
                    {i < streak ? (
                      i === 6 ? (
                        // Gift icon for day 7
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M20 12v10H4V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 7h20v5H2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 22V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )
                    ) : (
                      i === 6 ? (
                        // Gift icon for day 7 (unclaimed)
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M20 12v10H4V12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 7h20v5H2z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 22V12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <span className="font-bold text-sm">{i + 1}</span>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Log in daily to earn rewards!</div>
          {!loading && !claimedToday && (
            <button
              className="mt-4 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold px-6 py-2 rounded-full shadow hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleClaimReward}
              disabled={claiming || claimedToday}
            >
              {claiming ? 'Claiming...' : claimedToday ? 'Already Claimed' : 'Claim Reward'}
            </button>
          )}
          {showSuccess && (
            <div className="mt-3 text-green-600 font-semibold text-sm">Reward claimed! Come back tomorrow</div>
          )}
        </div>
        {/* LinkedIn Credentials Section */}
        <LinkedInCredentialsSection 
          onCredentialsSaved={handleCredentialsSaved}
          onCredentialsDeleted={handleCredentialsDeleted}
        />


        {/* Application Limit (fixed, not editable) */}
        <div className={`${themeBg} rounded-2xl ${themeShadow} border-4 ${themeBorder} ${electricClass} p-6 flex flex-col items-center w-full`}>
          <span className="font-bold text-lg mb-1">Application Limit</span>
          <span className="text-base text-gray-700 text-center mb-3">You can auto-apply to up to <span className="font-semibold text-[#984DE0]">{applicationLimit} jobs per day</span>.</span>
          {/* Progress Bar */}
          <div className="w-full max-w-xs flex flex-col items-center">
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-full transition-all duration-300"
                style={{ width: `${(autoAppliesUsed / applicationLimit) * 100}%` }}
              ></div>
            </div>
            <div className="w-full flex items-center justify-between gap-2">
              <span className="text-sm text-gray-600 font-medium">{autoAppliesUsed}/{applicationLimit} used</span>
              <button
                className="ml-2 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white text-xs font-semibold px-4 py-1 rounded-full shadow hover:scale-105 transition-all duration-200"
                onClick={goToPaywall}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
        {/* Blacklist as tags with edit toggle */}
        <div className={`${themeBg} rounded-2xl ${themeShadow} border-4 ${themeBorder} ${electricClass} p-6 flex flex-col w-full`}>
          <div className="w-full flex items-center justify-between mb-2">
            <span className="font-bold text-lg text-left">Blacklist</span>
            <button
              type="button"
              className="px-4 py-1 rounded-full bg-[#F3EFFF] text-[#984DE0] font-bold text-sm shadow border border-[#E2D6F7] hover:bg-[#E2D6F7] transition-colors"
              onClick={() => setBlacklistEditMode(e => !e)}
              aria-label={blacklistEditMode ? 'Save' : 'Edit blacklist'}
            >
              {blacklistEditMode ? 'Save' : 'Edit'}
            </button>
          </div>
          {blacklistEditMode && (
            <div className="w-full flex flex-row items-center gap-2 mt-2 mb-2">
              <input
                type="text"
                value={blacklistInput}
                onChange={e => setBlacklistInput(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && blacklistInput.trim()) {
                    e.preventDefault();
                    const newTag = blacklistInput.trim();
                    if (newTag && !blacklistTags.includes(newTag)) {
                      setBlacklistTags([...blacklistTags, newTag]);
                    }
                    setBlacklistInput('');
                  } else if (e.key === 'Backspace' && !blacklistInput && blacklistTags.length > 0) {
                    setBlacklistTags(blacklistTags.slice(0, -1));
                  }
                }}
                placeholder="Type a company or job type and press Enter"
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-xl bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <button
                type="button"
                className="px-4 py-2 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-semibold rounded-full shadow hover:scale-105 transition-all duration-200 text-sm"
                onClick={() => {
                  const newTag = blacklistInput.trim();
                  if (newTag && !blacklistTags.includes(newTag)) {
                    setBlacklistTags([...blacklistTags, newTag]);
                  }
                  setBlacklistInput('');
                }}
                disabled={!blacklistInput.trim() || blacklistTags.includes(blacklistInput.trim())}
              >
                Add
              </button>
            </div>
          )}
          <div className="w-full flex flex-wrap gap-2 mt-1 mb-1">
            {blacklistTags.length === 0 && !blacklistEditMode && (
              <span className="text-xs text-gray-400">No blacklist entries</span>
            )}
            {blacklistTags.map((tag, idx) => (
              <span
                key={tag}
                className="flex items-center bg-[#F3EFFF] text-[#984DE0] font-medium px-3 py-1 rounded-full text-sm shadow border border-[#E2D6F7]"
              >
                {tag}
                {blacklistEditMode && (
                  <button
                    type="button"
                    className="ml-2 text-[#984DE0] hover:text-[#7300FF] focus:outline-none"
                    onClick={() => setBlacklistTags(blacklistTags.filter((t, i) => i !== idx))}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500 mt-2 text-center w-full">We won't display jobs from these companies or with these job types.</span>
        </div>

      </div>
      {/* Reward Popup */}
      {showRewardPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xs w-full flex flex-col gap-4 items-center">
            <span className="text-2xl font-bold text-[#984DE0] mb-2">🎉 Daily Reward</span>
            <span className="text-lg text-gray-700 text-center">{rewardMsg}</span>
            <button
              className="mt-2 px-4 py-2 bg-white border-2 border-[#984DE0] font-semibold rounded-full shadow hover:bg-[#F3EFFF] transition-all duration-200 text-sm flex items-center justify-center whitespace-nowrap"
              onClick={goToPaywall}
            >
              <span className="text-black whitespace-nowrap">Find out how to get more </span>
              <span className="text-[#984DE0] ml-1 whitespace-nowrap">for free</span>
            </button>
            <button
              className="mt-3 px-6 py-2 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-semibold rounded-full shadow hover:scale-105 transition-all duration-200 text-base"
              onClick={() => setShowRewardPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Electric Glow Animation */}
      <style>
        {`
          @keyframes electric-glow {
            0% { box-shadow: 0 0 0 0 #984DE0, 0 0 0 0 #7300FF; }
            30% { box-shadow: 0 0 8px 2px #984DE0, 0 0 12px 4px #7300FF; }
            70% { box-shadow: 0 0 12px 4px #984DE0, 0 0 18px 8px #7300FF; }
            100% { box-shadow: 0 0 0 0 #984DE0, 0 0 0 0 #7300FF; }
          }
          .animate-electric-glow {
            animation: electric-glow 0.6s cubic-bezier(0.4,0,0.2,1);
          }
        `}
      </style>
      {/* Bottom Nav (copied from ProfileScreen) */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-r from-[#984DE0] to-[#7300FF] rounded-t-[2rem] p-8 z-10 flex items-center justify-center">
        <div className="w-fit mx-auto bg-white rounded-3xl flex justify-center items-center gap-6 py-3 px-8 shadow-lg border-2 border-gray-400">
          <button onClick={goToSaved} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Saved</button>
          <button onClick={goToHome} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Discover</button>
          <button onClick={goToApplied} className="text-purple-400 font-bold text-xl hover:text-purple-600 transition-all duration-300 transform hover:scale-105">Applied</button>
        </div>
      </div>
    </div>
  );
};

export default AutoApplyScreen; 