import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Kandu Jobs | How We Protect Your Data</title>
        <meta name="description" content="Read Kandu Jobs' comprehensive privacy policy. Learn how we collect, use, and protect your personal information and job application data." />
        <meta name="keywords" content="privacy policy, data protection, kandu jobs, job application privacy, personal data" />
        <meta property="og:title" content="Privacy Policy - Kandu Jobs" />
        <meta property="og:description" content="Learn how Kandu Jobs protects your personal information and job application data." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kandujobs.com/privacy-policy" />
        <link rel="canonical" href="https://kandujobs.com/privacy-policy" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Privacy Policy - Kandu Jobs",
            "description": "Comprehensive privacy policy explaining how Kandu Jobs collects, uses, and protects user data.",
            "url": "https://kandujobs.com/privacy-policy",
            "publisher": {
              "@type": "Organization",
              "name": "Kandu Jobs",
              "url": "https://kandujobs.com"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 mb-6">
                At Kandu Jobs ("we," "our," or "us"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our job application automation platform.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">
                We collect personal information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Name, email address, and phone number</li>
                <li>Resume and professional information</li>
                <li>LinkedIn credentials (encrypted and securely stored)</li>
                <li>Job preferences and application history</li>
                <li>Payment information (processed securely through Stripe)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1.2 Automatically Collected Information</h3>
              <p className="text-gray-700 mb-4">
                We automatically collect certain information when you use our platform:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Device information and IP address</li>
                <li>Browser type and version</li>
                <li>Usage patterns and interaction data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>Provide and maintain our job application automation services</li>
                <li>Process job applications on your behalf</li>
                <li>Personalize your experience and improve our platform</li>
                <li>Send you important updates and notifications</li>
                <li>Process payments and manage subscriptions</li>
                <li>Comply with legal obligations and prevent fraud</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure data centers with physical and digital security</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection practices</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data at any time, subject to certain legal requirements.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                Our platform may integrate with third-party services (such as LinkedIn, Stripe, and email providers). These services have their own privacy policies, and we encourage you to review them.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during international transfers.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@kandujobs.com</p>
                <p className="text-gray-700 mb-2"><strong>Address:</strong> Kandu Jobs, [Your Business Address]</p>
                <p className="text-gray-700"><strong>Phone:</strong> [Your Phone Number]</p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  This Privacy Policy is effective as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} and applies to all users of the Kandu Jobs platform.
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

export default PrivacyPolicy;
