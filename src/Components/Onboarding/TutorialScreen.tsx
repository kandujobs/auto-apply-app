import React, { useState } from "react";

interface TutorialScreenProps {
  onContinue: () => void;
}

const steps = [
  {
    label: "Navigation",
    description: "Use the top bar for notifications, your profile, and filters. Use the bottom bar to switch between Discover, Saved, and Applied jobs.",
  },
  {
    label: "Swipe Right to Apply",
    description: "Swipe right on a job card to instantly apply.",
  },
  {
    label: "Swipe Left to Reject",
    description: "Swipe left on a job card to pass on a job.",
  },
  {
    label: "Save a Job",
    description: "Tap the bookmark icon to save a job for later.",
  },
  {
    label: "View Saved & Applied",
    description: "Access your saved and applied jobs anytime from the bottom bar.",
  },
];

const TutorialScreen: React.FC<TutorialScreenProps> = ({ onContinue }) => {
  const [step, setStep] = useState(0);
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
      {/* Stepper and controls only */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <div className="bg-white bg-opacity-95 rounded-xl px-6 py-4 shadow-lg flex flex-col items-center">
          <div className="text-lg font-bold mb-2 text-center">{current.label}</div>
          <div className="text-gray-700 mb-4 text-center max-w-xs">{current.description}</div>
          <div className="flex gap-2 mt-2">
            {step < steps.length - 1 ? (
              <button
                className="px-6 py-2 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg hover:opacity-90 transition-opacity"
                onClick={() => setStep(step + 1)}
              >
                Next
              </button>
            ) : (
              <button
                className="px-6 py-2 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg hover:opacity-90 transition-opacity"
                onClick={onContinue}
              >
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialScreen; 