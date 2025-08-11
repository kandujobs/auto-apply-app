import React, { useState } from "react";
import { Job } from "../../types/Job";

interface RejectedJobsSectionProps {
  rejectedJobs: Job[];
  onApplyJob: (job: Job) => void;
  onSaveJob?: (job: Job) => void;
}

const RejectedJobsSection: React.FC<RejectedJobsSectionProps> = ({ 
  rejectedJobs,
  onApplyJob,
  onSaveJob
}) => {
  // Get the last 8 rejected jobs
  const lastRejectedJobs = rejectedJobs.slice(0, 8);
  
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = () => {
    if (selectedJob && onApplyJob) {
      onApplyJob(selectedJob);
      setShowApplyModal(false);
      setSelectedJob(null);
    }
  };

  const handleCancelApplication = () => {
    setShowApplyModal(false);
    setSelectedJob(null);
  };

  const handleBookmarkClick = (job: Job) => {
    if (onSaveJob) {
      onSaveJob(job);
    }
  };

  return (
    <div className="w-full bg-white rounded-[25px] outline outline-[3px] outline-[#CDCCCC] p-5 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[18px] font-bold text-[#5C1EE2]">The Last Jobs You've Rejected</h2>
      </div>
      {lastRejectedJobs.length === 0 ? (
        // Show a helpful message when no jobs have been rejected
        <div className="w-full flex flex-col items-center justify-center py-12">
          <div className="text-gray-500 text-lg font-semibold mb-2 text-center">
            No Rejected Jobs Yet
          </div>
          <div className="text-gray-400 text-sm text-center">
            Start swiping to see your rejected jobs here. Swipe left to reject jobs.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide py-2 smartfeed-scroll" style={{ touchAction: 'pan-x', minHeight: '140px', overflowY: 'hidden' }}>
          <div className="flex flex-row gap-x-4 whitespace-nowrap pl-2" style={{ minWidth: 'max-content', paddingBottom: '16px' }}>
            {lastRejectedJobs.map((job) => (
              <div
                key={job.id}
                className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-lg border-4 border-gray-300 p-4 flex flex-col"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                    <p className="text-sm text-gray-500">{job.company}</p>
                  </div>
                  <button
                    onClick={() => handleBookmarkClick(job)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400 hover:text-yellow-500 transition-colors"
                    title="Save job"
                  >
                    ☆
                  </button>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-purple-400 font-semibold text-base">{job.salary}</p>
                    <p className="text-xs text-gray-500">{job.location}</p>
                  </div>
                  <button
                    onClick={() => handleApplyClick(job)}
                    className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full font-semibold text-sm shadow-sm hover:bg-purple-200 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Confirmation Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-4">Confirm Application</h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to apply to:
            </p>
            <p className="font-semibold text-gray-800 mb-4">
              {selectedJob.title} at {selectedJob.company}?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will move the job from your rejected list to your applied jobs.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelApplication}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitApplication}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RejectedJobsSection; 