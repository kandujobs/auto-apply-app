import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-6">
                Welcome to Kandu Jobs. These Terms of Service ("Terms") govern your use of our job application automation platform and services. By accessing or using our platform, you agree to be bound by these Terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By creating an account, accessing, or using Kandu Jobs' services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not use our services.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of Services</h2>
              <p className="text-gray-700 mb-4">
                Kandu Jobs provides an automated job application platform that helps users:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Automate job applications on LinkedIn and other job platforms</li>
                <li>Manage and track job applications</li>
                <li>Store and organize resume and professional information</li>
                <li>Receive job recommendations and notifications</li>
                <li>Access job market insights and analytics</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Accounts and Registration</h2>
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To use our services, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2 Account Responsibilities</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>All activities that occur under your account</li>
                <li>Maintaining the security of your account credentials</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your account information remains accurate and up-to-date</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">
                You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Use our services for any illegal or unauthorized purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our services</li>
                <li>Use automated systems to access our services without permission</li>
                <li>Submit false or misleading information</li>
                <li>Use our services to spam or harass others</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Subscription and Payment Terms</h2>
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.1 Subscription Plans</h3>
              <p className="text-gray-700 mb-4">
                We offer various subscription plans with different features and limitations. Subscription details, including pricing and features, are available on our website and may be updated from time to time.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.2 Payment Processing</h3>
              <p className="text-gray-700 mb-4">
                Payments are processed securely through Stripe. By subscribing, you authorize us to charge your payment method for the applicable fees. All fees are non-refundable except as required by law.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.3 Subscription Cancellation</h3>
              <p className="text-gray-700 mb-4">
                You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. No refunds will be provided for partial billing periods.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. User Content and Data</h2>
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.1 Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of any content you submit to our platform, including resumes, job preferences, and application data. By submitting content, you grant us a license to use, store, and process this content to provide our services.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.2 Data Privacy</h3>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Intellectual Property Rights</h2>
              <p className="text-gray-700 mb-4">
                Our platform, including its content, features, and functionality, is owned by Kandu Jobs and is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written consent.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Third-Party Services and Integrations</h2>
              <p className="text-gray-700 mb-4">
                Our platform integrates with third-party services such as LinkedIn, job boards, and payment processors. Your use of these third-party services is subject to their respective terms of service and privacy policies.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Disclaimers and Limitations of Liability</h2>
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.1 Service Availability</h3>
              <p className="text-gray-700 mb-4">
                We strive to provide reliable and uninterrupted service, but we do not guarantee that our platform will be available at all times. We may suspend or discontinue services for maintenance, updates, or other reasons.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.2 Job Application Results</h3>
              <p className="text-gray-700 mb-4">
                While we automate the job application process, we cannot guarantee job offers, interviews, or employment. Job application outcomes depend on various factors beyond our control, including employer preferences and market conditions.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.3 Limitation of Liability</h3>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, Kandu Jobs shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold harmless Kandu Jobs, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our services or violation of these Terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and access to our services at any time, with or without cause, with or without notice. Upon termination, your right to use our services will cease immediately.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of [Your Jurisdiction]. Any disputes arising from these Terms or your use of our services shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization].
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the updated Terms on our website and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the new Terms.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Severability</h2>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> legal@kandujobs.com</p>
                <p className="text-gray-700 mb-2"><strong>Address:</strong> Kandu Jobs, [Your Business Address]</p>
                <p className="text-gray-700"><strong>Phone:</strong> [Your Phone Number]</p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  These Terms of Service are effective as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} and apply to all users of the Kandu Jobs platform.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Kandu Jobs. All rights reserved. | 
              <a href="/terms-of-service" className="text-blue-400 hover:text-blue-300 ml-2">Terms of Service</a> | 
              <a href="/privacy-policy" className="text-blue-400 hover:text-blue-300 ml-2">Privacy Policy</a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default TermsOfService;
