import React from 'react';

interface PrivacyPolicyScreenProps {
  goBack: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ goBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={goBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Last updated:</strong> [INSERT DATE]
            </p>

            <div className="space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> This section needs to be filled with your official privacy policy content. 
                    Please consult with your legal team to ensure compliance with applicable laws and regulations.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT YOUR PRIVACY POLICY INTRODUCTION HERE]
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Detail what personal information you collect from users.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT INFORMATION COLLECTION DETAILS HERE]
                </p>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain how you use the collected information.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT INFORMATION USAGE DETAILS HERE]
                </p>
              </section>

              {/* Information Sharing */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain when and how you share user information.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT INFORMATION SHARING DETAILS HERE]
                </p>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Describe your data security measures.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT DATA SECURITY DETAILS HERE]
                </p>
              </section>

              {/* User Rights */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain user rights regarding their data.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT USER RIGHTS DETAILS HERE]
                </p>
              </section>

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain your use of cookies and tracking.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT COOKIES AND TRACKING DETAILS HERE]
                </p>
              </section>

              {/* Third Party Services */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Services</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> List third-party services you use (Google, Stripe, etc.).
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT THIRD-PARTY SERVICES DETAILS HERE]
                </p>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Address COPPA compliance if applicable.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT CHILDREN'S PRIVACY DETAILS HERE]
                </p>
              </section>

              {/* International Users */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Users</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Address GDPR, CCPA, and other international privacy laws.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT INTERNATIONAL USERS DETAILS HERE]
                </p>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain how you notify users of policy changes.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT POLICY CHANGES DETAILS HERE]
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Provide contact information for privacy inquiries.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT CONTACT INFORMATION HERE]
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyScreen;
