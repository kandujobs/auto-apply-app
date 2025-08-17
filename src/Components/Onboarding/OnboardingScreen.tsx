import React, { useState, useEffect } from "react";

// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?worker';
import * as pdfjsLib from 'pdfjs-dist';

// Vite's ?worker import returns a Worker constructor, not a string. Use workerPort if available.
if ('workerPort' in pdfjsLib.GlobalWorkerOptions) {
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();
} else {
  // fallback for environments expecting a string (not ideal, but for compatibility)
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = (typeof pdfjsWorker === 'string') ? pdfjsWorker : '';
}






const FEATURES = [
  { icon: "🤖", text: "Auto-apply to jobs" },
  { icon: "📊", text: "Track your applications" },
  { icon: "💡", text: "Smart job recommendations" },
  { icon: "🔔", text: "Search notifications" },
];



const OnboardingScreen: React.FC<{
  onUploadResume: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  onShowTutorial?: () => void;
  onComplete?: () => void;
}> = ({ onSignIn, onSignUp, onBack, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    // Navigate to sign-up screen
    onSignUp();
  };

  const handleSignIn = () => {
    onSignIn();
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-32 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-32 transition-all duration-500" />
      
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4 py-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center">
          
          {/* Logo/Brand */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">K</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Kandu</h1>
            <p className="text-gray-600 text-sm">Your AI-powered job search assistant</p>
          </div>

          {/* Features List */}
          <div className="mb-6 w-full">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Applying to jobs is hard, we make it easy:</h2>
            <div className="space-y-2">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-gray-700 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-[1rem] hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Getting Started...
                </div>
              ) : (
                "Get Started"
              )}
            </button>

            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full bg-white text-purple-600 font-bold py-3 px-6 rounded-[1rem] border-2 border-purple-600 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen; 