import React from 'react';

interface TermsOfServiceScreenProps {
  goBack: () => void;
}

const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({ goBack }) => {
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
            <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> This section needs to be filled with your official terms of service content. 
                    Please consult with your legal team to ensure compliance with applicable laws and regulations.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT YOUR TERMS OF SERVICE ACCEPTANCE CLAUSE HERE]
                </p>
              </section>

              {/* Description of Service */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Describe what Kandu does and the services you provide.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT SERVICE DESCRIPTION HERE]
                </p>
              </section>

              {/* User Accounts */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain account creation, responsibilities, and security.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT USER ACCOUNT DETAILS HERE]
                </p>
              </section>

              {/* Acceptable Use */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Define what users can and cannot do on your platform.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT ACCEPTABLE USE POLICY HERE]
                </p>
              </section>

              {/* User Content */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Content and Intellectual Property</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Address ownership of user-uploaded content (resumes, profiles, etc.).
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT USER CONTENT AND IP DETAILS HERE]
                </p>
              </section>

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms and Subscription</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain pricing, billing, refunds, and subscription terms.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT PAYMENT TERMS HERE]
                </p>
              </section>

              {/* Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Reference your privacy policy and data handling practices.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT PRIVACY AND DATA PROTECTION DETAILS HERE]
                </p>
              </section>

              {/* Disclaimers */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers and Limitations</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Include disclaimers about job placement, service availability, etc.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT DISCLAIMERS AND LIMITATIONS HERE]
                </p>
              </section>

              {/* Liability */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Limit your liability for damages, losses, etc.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT LIMITATION OF LIABILITY DETAILS HERE]
                </p>
              </section>

              {/* Indemnification */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Require users to indemnify you against certain claims.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT INDEMNIFICATION DETAILS HERE]
                </p>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain when and how accounts can be terminated.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT TERMINATION DETAILS HERE]
                </p>
              </section>

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Specify governing law and how disputes will be resolved.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT GOVERNING LAW AND DISPUTE RESOLUTION DETAILS HERE]
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Explain how you notify users of terms changes.
                  </p>
                </div>
                <p className="text-gray-700">
                  [INSERT TERMS CHANGES DETAILS HERE]
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>⚠️ PLACEHOLDER CONTENT:</strong> Provide contact information for legal inquiries.
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

export default TermsOfServiceScreen;
