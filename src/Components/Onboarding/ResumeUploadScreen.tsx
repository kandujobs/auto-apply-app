import React, { useRef, useState } from "react";

interface ResumeUploadScreenProps {
  onContinue: () => void;
  onBack: () => void;
  resumeFile: File | null;
  onFileChange: (file: File | null) => void;
  onBackAnimated?: () => void;
  onPasteTextContinue?: (text: string) => void;
  uploadStatus?: 'idle' | 'success' | 'error';
  setUploadStatus?: (status: 'idle' | 'success' | 'error') => void;
}

const ResumeUploadScreen: React.FC<ResumeUploadScreenProps> = ({
  onContinue,
  onBack,
  resumeFile,
  onFileChange,
  onBackAnimated,
  onPasteTextContinue,
  uploadStatus = 'idle',
  setUploadStatus,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [pastedText, setPastedText] = useState("");

  const handleBoxClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
    if (setUploadStatus) setUploadStatus('idle'); // Reset status on new file
  };

  const handlePasteContinue = () => {
    if (onPasteTextContinue && pastedText.trim()) {
      onPasteTextContinue(pastedText);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Top gradient bar */}
      <div className="absolute left-0 top-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-b-[2rem] h-32 transition-all duration-500" />
      {/* Bottom gradient bar */}
      <div className="absolute left-0 bottom-0 w-full bg-gradient-to-r from-[#984DE0] to-[#7300FF] z-0 rounded-t-[2rem] h-32 transition-all duration-500" />
      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border-4 border-gray-250 p-6 flex flex-col items-center mt-16 mb-8">
          <h2 className="text-2xl font-bold text-black mb-2 text-center w-full">Upload Your Resume</h2>
          <p className="text-base text-gray-500 mb-6 text-center w-full">One file. Endless possibilities.</p>
          {!showPaste && (
            <>
          <div
                className="w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center py-10 mb-6 cursor-pointer relative hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
                onClick={handleBoxClick}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center">
              <div className="bg-purple-200 rounded-full p-4 mb-3">
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24"><path fill="#6C00FF" d="M12 16V4m0 0-4 4m4-4 4 4" stroke="#6C00FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="#A100FF"/></svg>
              </div>
              <div className="font-semibold text-gray-700 text-center">
                {uploadStatus === 'success' && (
                  <span className="text-green-600">Resume successfully uploaded!</span>
                )}
                {uploadStatus === 'error' && (
                  <span className="text-red-600">Error uploading</span>
                )}
                {uploadStatus === 'idle' && 'Upload your resume here'}
              </div>
              <div className="text-xs text-gray-500 mt-1">browse any files (PDF, DOCX)</div>
              {resumeFile && (
                <div className="mt-2 text-purple-700 text-sm font-medium">{resumeFile.name}</div>
              )}
            </div>
          </div>
          <button
                className="w-full py-2 rounded-full bg-gray-100 text-[#7300FF] font-semibold mb-4 border border-[#7300FF] hover:bg-purple-50 transition-colors"
                onClick={() => setShowPaste(true)}
              >
                Paste Resume Text Instead
              </button>
            </>
          )}
          {showPaste && (
            <>
              <textarea
                className="w-full h-40 border border-gray-300 rounded-lg p-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Paste your resume text here..."
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
              />
              <button
                className="w-full py-3 rounded-[1rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-bold shadow-lg mb-4 disabled:opacity-60"
                onClick={handlePasteContinue}
                disabled={!pastedText.trim()}
          >
                Continue
          </button>
          <button
                className="w-full py-2 rounded-full bg-gray-100 text-[#7300FF] font-semibold border border-[#7300FF] hover:bg-purple-50 transition-colors"
                onClick={() => setShowPaste(false)}
              >
                Back to Upload
              </button>
            </>
          )}
          {/* Remove Continue button and parsing spinner */}
          <button
            className="text-[#7300FF] underline text-base mt-4"
                onClick={() => (onBackAnimated ? onBackAnimated() : onBack())}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadScreen; 