import React, { useState } from 'react';

interface Question {
  id: string;
  question: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

interface AdditionalQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (answers: Record<string, string>) => void;
  questions: Question[];
  jobTitle: string;
  companyName: string;
}

const AdditionalQuestionsModal: React.FC<AdditionalQuestionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  questions,
  jobTitle,
  companyName
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleInputChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    onConfirm(answers);
  };

  const handleClose = () => {
    setAnswers({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose}></div>
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Additional Questions</h2>
            <p className="text-gray-600 text-sm">{jobTitle} at {companyName}</p>
          </div>
          
          {/* Questions */}
          <div className="p-6 space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {question.type === 'text' && (
                  <input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your answer..."
                    required={question.required}
                  />
                )}
                
                {question.type === 'textarea' && (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter your answer..."
                    required={question.required}
                  />
                )}
                
                {question.type === 'select' && question.options && (
                  <select
                    value={answers[question.id] || ''}
                    onChange={(e) => handleInputChange(question.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required={question.required}
                  >
                    <option value="">Select an option...</option>
                    {question.options.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-between gap-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdditionalQuestionsModal; 