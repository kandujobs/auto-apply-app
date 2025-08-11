import React, { useState } from "react";

interface FeedbackSectionProps {
  onSendFeedback?: (feedback: string) => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ onSendFeedback }) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendFeedback = () => {
    if (feedback.trim()) {
      setIsSubmitting(true);
      
      // Call the parent function to handle feedback
      if (onSendFeedback) {
        onSendFeedback(feedback.trim());
      }
      
      // Reset form
      setFeedback("");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFeedback("");
  };

  return (
    <div className="w-full bg-white rounded-[25px] outline outline-[3px] outline-[#CDCCCC] p-5 shadow-sm">
      <div className="flex flex-col gap-3 mb-4">
        <h2 className="text-[20px] font-bold text-black">Give Us Feedback</h2>
        <p className="text-black/60 text-sm">This goes straight to the founders</p>
      </div>
      
      <div className="w-full h-[150px] p-3 bg-white shadow-md rounded-[15px] outline outline-[3px] outline-[#A4A4A4] flex items-start mb-4">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="We'd love to hear your thoughts..."
          className="w-full h-full text-sm border-none outline-none resize-none bg-transparent"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSendFeedback}
          disabled={!feedback.trim() || isSubmitting}
          className="px-6 py-2 bg-[#5C1EE2] text-white rounded-lg font-semibold hover:bg-[#4A1BC7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Feedback"}
        </button>
      </div>
    </div>
  );
};

export default FeedbackSection; 