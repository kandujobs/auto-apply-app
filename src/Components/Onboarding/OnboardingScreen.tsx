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
  { icon: "🔔", text: "Improve your resume" },
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      {/* Top gradient bar */}
       <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-32 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-32 transition-all duration-500" />
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-4 border-gray-250 p-8 px-4">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kandu</h1>
          <p className="text-gray-600">Your AI-powered job search assistant</p>
        </div>

        {/* Features List */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Applying to jobs is hard, we make it easy:</h2>
          <div className="space-y-3">
            {FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-[1rem] hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full bg-white text-purple-600 font-semibold py-3 px-6 rounded-[1rem] border-2 border-purple-600 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign In
          </button>
       
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen; 