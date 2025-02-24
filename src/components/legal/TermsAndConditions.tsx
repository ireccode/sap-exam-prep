import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle } from 'lucide-react';

export function TermsAndConditions() {
  const navigate = useNavigate();

  const handleAccept = () => {
    // Store acceptance in localStorage
    localStorage.setItem('termsAccepted', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Welcome to SAP Architect Prep! By using this app, you agree to comply with the following terms and conditions.
          </p>

          {/* Sections */}
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Intellectual Property</h2>
              <p className="text-gray-600">
                All content within this app, including questions, explanations, AI-generated responses, and design elements,
                is the intellectual property of SAP Architect Prep. Unauthorized reproduction or distribution is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Compliance with SAP Policies</h2>
              <p className="text-gray-600">
                This app adheres to SAP's fair use policies by providing transformative educational content.
                Users must not share or distribute any content that violates SAP's certification guidelines
                or non-disclosure agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Data Privacy</h2>
              <p className="text-gray-600">
                Your personal data is collected and processed in accordance with our Privacy Policy.
                We use Supabase for secure data storage and do not share your data with third parties
                without your consent. Your practice results and progress are stored securely and are
                only accessible to you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Prohibited Activities</h2>
              <p className="text-gray-600">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-2 space-y-2">
                <li>Share or distribute actual SAP certification exam questions</li>
                <li>Use the app for any unlawful activities</li>
                <li>Attempt to reverse engineer or copy the app's content</li>
                <li>Share your account credentials with others</li>
                <li>Violate any SAP certification exam policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Limitation of Liability</h2>
              <p className="text-gray-600">
                The app is provided "as is" without warranties of any kind. The creators are not liable
                for any damages resulting from the use of this app. While we strive to provide accurate
                information, we cannot guarantee that all content is error-free or up-to-date with the
                latest SAP certification requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Updates to Terms</h2>
              <p className="text-gray-600">
                We may update these terms periodically. Continued use of the app signifies your
                acceptance of any changes. Users will be notified of significant changes to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Subscription and Payments</h2>
              <p className="text-gray-600">
                Premium features require a subscription. Payments are processed securely through Stripe.
                Subscriptions can be cancelled at any time through your profile settings. Refunds are
                handled in accordance with our refund policy.
              </p>
            </section>

            {/* Warning Box */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This app is not affiliated with, endorsed by, or connected to SAP SE. SAP and other SAP
                    products mentioned are trademarks or registered trademarks of SAP SE in Germany and other countries.
                  </p>
                </div>
              </div>
            </div>

            {/* Accept Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleAccept}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Accept Terms and Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 