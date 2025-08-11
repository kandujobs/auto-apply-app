import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface UpgradeScreenProps {
  goBack?: () => void;
  goToHome?: () => void;
  goToSaved?: () => void;
  goToApplied?: () => void;
  goToProfile?: () => void;
  goToNotifications?: () => void;
}

const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ goBack, goToHome, goToSaved, goToApplied, goToProfile, goToNotifications }) => {
  const [userId, setUserId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchUserId() {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) setUserId(userData.user.id);
    }
    fetchUserId();
  }, []);

  const referralLink = userId ? `${window.location.origin}/signup?ref=${userId}` : '';

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 pt-40 pb-40 px-4">
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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center mb-8 mt-4">
        <span className="font-bold text-xl text-[#984DE0] mb-2">Refer a friend!</span>
        <span className="text-base text-gray-700 text-center mb-3">When they log in, you get <span className="font-bold text-[#984DE0]">+5</span> to your daily application limit.</span>
        <div className="w-full flex flex-row items-center gap-2 mb-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-xl bg-gray-50 text-base focus:outline-none"
          />
          <button
            className="px-4 py-2 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-semibold rounded-full shadow hover:scale-105 transition-all duration-200 text-sm"
            onClick={handleCopy}
            disabled={!referralLink}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
      {/* Top Up Credits Section */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center mb-8">
        <span className="font-bold text-lg text-gray-700 mb-4">Top Up Credits</span>
        <div className="w-full flex flex-row gap-4 justify-center items-stretch flex-wrap overflow-x-auto pb-2">
          <button className="min-w-[110px] flex-1 flex flex-col items-center justify-center bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold rounded-2xl py-4 shadow hover:scale-105 transition-all duration-200 border-2 border-[#ecd7fa]">
            <span className="text-xl">10 Credits</span>
            <span className="text-base font-semibold mt-1">$2.99</span>
          </button>
          <button className="min-w-[110px] flex-1 flex flex-col items-center justify-center bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold rounded-2xl py-4 shadow hover:scale-105 transition-all duration-200 border-2 border-[#ecd7fa]">
            <span className="text-xl">25 Credits</span>
            <span className="text-base font-semibold mt-1">$6.99</span>
          </button>
          <button className="min-w-[110px] flex-1 flex flex-col items-center justify-center bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold rounded-2xl py-4 shadow hover:scale-105 transition-all duration-200 border-2 border-[#ecd7fa]">
            <span className="text-xl">50 Credits</span>
            <span className="text-base font-semibold mt-1">$12.99</span>
          </button>
        </div>
      </div>
      {/* Subscription Section */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center mb-8">
        <span className="font-bold text-lg text-gray-700 mb-4">Subscription</span>
        <div className="w-full flex flex-col items-center justify-center bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold rounded-2xl py-6 shadow border-2 border-[#ecd7fa] mb-4">
          <span className="text-2xl mb-2">Unlimited Applications</span>
          <span className="text-lg font-semibold">$19.99/mo</span>
        </div>
        <button className="w-full bg-[#984DE0] text-white px-6 py-3 rounded-xl font-semibold text-lg shadow hover:bg-[#7300FF] transition-colors">Subscribe</button>
      </div>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border-4 border-gray-300 p-6 flex flex-col items-center">
        <span className="font-bold text-lg text-gray-700 mb-2">Upgrade Options</span>
        <span className="text-base text-gray-500 text-center mb-4">(Paid upgrade options coming soon!)</span>
        <div className="w-full flex flex-col gap-4">
          <button className="w-full flex flex-col items-center justify-center bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold rounded-2xl py-4 shadow hover:scale-105 transition-all duration-200 border-2 border-[#ecd7fa]">
            <span className="text-xl">2x Daily Auto-Apply Limit</span>
            <span className="text-base font-semibold mt-1">$9.99 (one-time)</span>
            <span className="text-xs font-normal mt-1">Permanently double your daily auto-apply limit.</span>
          </button>
          <button className="w-full flex flex-col items-center justify-center bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-bold rounded-2xl py-4 shadow hover:scale-105 transition-all duration-200 border-2 border-[#ecd7fa]">
            <span className="text-xl">3x Daily Auto-Apply Limit</span>
            <span className="text-base font-semibold mt-1">$17.99 (one-time)</span>
            <span className="text-xs font-normal mt-1">Permanently triple your daily auto-apply limit.</span>
          </button>
        </div>
      </div>
      {goBack && (
        <button
          className="mt-8 px-6 py-2 bg-gradient-to-r from-[#984DE0] to-[#7300FF] text-white font-semibold rounded-full shadow hover:scale-105 transition-all duration-200 text-base"
          onClick={goBack}
        >
          Back
        </button>
      )}
      {/* Bottom Nav Gradient Bar */}
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

export default UpgradeScreen; 