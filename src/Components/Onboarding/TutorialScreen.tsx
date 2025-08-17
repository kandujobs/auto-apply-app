import React, { useState } from "react";
import { FiHome, FiBookmark, FiCheckCircle, FiX, FiUser, FiBell, FiFilter } from "react-icons/fi";

interface TutorialScreenProps {
  onContinue: () => void;
}

const steps = [
  {
    label: "Welcome to Kandu!",
    description: "Your AI-powered job search assistant. Let's get you started with the basics.",
    icon: "🎯",
    highlight: "discover"
  },
  {
    label: "Navigation",
    description: "Use the top bar for notifications, your profile, and filters. Use the bottom bar to switch between Discover, Saved, and Applied jobs.",
    icon: "🧭",
    highlight: "navigation"
  },
  {
    label: "Swipe Right to Apply",
    description: "Swipe right on a job card to instantly apply to jobs that match your profile.",
    icon: "✅",
    highlight: "apply"
  },
  {
    label: "Swipe Left to Pass",
    description: "Swipe left on a job card to pass on jobs that don't interest you.",
    icon: "❌",
    highlight: "pass"
  },
  {
    label: "Save Jobs for Later",
    description: "Tap the bookmark icon to save interesting jobs for later review.",
    icon: "🔖",
    highlight: "save"
  },
  {
    label: "Track Your Progress",
    description: "View your saved and applied jobs anytime from the bottom navigation bar.",
    icon: "📊",
    highlight: "track"
  },
];

const TutorialScreen: React.FC<TutorialScreenProps> = ({ onContinue }) => {
  const [step, setStep] = useState(0);
  const current = steps[step];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-32 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-32 transition-all duration-500" />
      
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4 py-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center h-[calc(100vh-8rem)] max-h-[600px]">
          
          {/* Tutorial Content */}
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            {/* Icon */}
            <div className="text-6xl mb-6">{current.icon}</div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{current.label}</h2>
            
            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed max-w-sm mb-8">
              {current.description}
            </p>
            
            {/* Visual Demo */}
            <div className="w-full max-w-xs mb-8">
              {current.highlight === 'navigation' && (
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <FiBell className="w-5 h-5 text-gray-600" />
                    <FiUser className="w-5 h-5 text-gray-600" />
                    <FiFilter className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex justify-around items-center">
                    <div className="text-center">
                      <FiHome className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                      <span className="text-xs text-gray-600">Discover</span>
                    </div>
                    <div className="text-center">
                      <FiBookmark className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-600">Saved</span>
                    </div>
                    <div className="text-center">
                      <FiCheckCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <span className="text-xs text-gray-600">Applied</span>
                    </div>
                  </div>
                </div>
              )}
              
              {current.highlight === 'apply' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                  <div className="flex items-center justify-center mb-2">
                    <FiCheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-800 font-semibold">Swipe Right to Apply</p>
                </div>
              )}
              
              {current.highlight === 'pass' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                  <div className="flex items-center justify-center mb-2">
                    <FiX className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-800 font-semibold">Swipe Left to Pass</p>
                </div>
              )}
              
              {current.highlight === 'save' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                  <div className="flex items-center justify-center mb-2">
                    <FiBookmark className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-blue-800 font-semibold">Tap to Save</p>
                </div>
              )}
              
              {current.highlight === 'track' && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
                  <div className="flex items-center justify-center mb-2">
                    <FiCheckCircle className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-purple-800 font-semibold">Track Progress</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Dots */}
          <div className="flex gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === step ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="w-full">
            {step < steps.length - 1 ? (
              <button
                className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                onClick={() => setStep(step + 1)}
              >
                Next
              </button>
            ) : (
              <button
                className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                onClick={onContinue}
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialScreen; 