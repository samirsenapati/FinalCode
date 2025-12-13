export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
          <p className="text-sm text-gray-400">
            Last Updated: December 13, 2025
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Introduction</h2>
            <p>
              FinalCode ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our Service.
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy
              policy, please do not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.1 Personal Information</h3>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Email address (required for account creation)</li>
              <li>Password (encrypted and securely stored)</li>
              <li>GitHub profile information (if using GitHub OAuth)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Subscription plan and billing details</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.2 Usage Information</h3>
            <p>
              We automatically collect certain information about your use of the Service:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Number of AI requests made</li>
              <li>Project creation and deployment activity</li>
              <li>Feature usage statistics</li>
              <li>Device information and browser type</li>
              <li>IP address and approximate location</li>
              <li>Session duration and interaction patterns</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.3 Code and Content</h3>
            <p>
              We store the following content you create:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Code files (HTML, CSS, JavaScript, etc.)</li>
              <li>Project configurations</li>
              <li>AI chat conversations (for improving the service)</li>
              <li>Deployment records and preview URLs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your subscriptions and payments</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze usage trends and patterns</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Enforce our Terms of Service</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Third-Party Services</h2>
            <p>
              We use the following third-party services that may collect, store, or process your information:
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.1 Supabase</h3>
            <p>
              We use Supabase for authentication and database services. Your account credentials and project
              data are stored on Supabase servers with industry-standard encryption.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.2 Anthropic (Claude AI)</h3>
            <p>
              When you use AI features, your prompts and code context are sent to Anthropic's Claude API for
              processing. Anthropic's data handling practices are governed by their privacy policy.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.3 Stripe</h3>
            <p>
              Payment processing is handled by Stripe. We do not store your full credit card information.
              Stripe's privacy policy governs their handling of your payment data.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.4 Cloudflare Pages</h3>
            <p>
              When you deploy projects, your code is deployed to Cloudflare Pages. Deployed content is subject
              to Cloudflare's privacy practices.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.5 Analytics Services</h3>
            <p>
              We may use analytics services (such as Vercel Analytics, PostHog, or similar) to understand how
              users interact with our Service. These services may use cookies and similar technologies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Data Storage and Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your
              information:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>All data transmissions are encrypted using SSL/TLS</li>
              <li>Passwords are hashed using industry-standard algorithms</li>
              <li>Database access is restricted and monitored</li>
              <li>Regular security audits and updates</li>
              <li>Row-level security (RLS) for database access control</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure.
              While we strive to use commercially acceptable means to protect your information, we cannot
              guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide you
              with the Service. We will also retain and use your information as necessary to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
              <li>Maintain audit trails</li>
            </ul>
            <p className="mt-4">
              Temporary preview URLs and associated data are automatically deleted after 24 hours.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Your Rights and Choices</h2>
            <p>
              You have the following rights regarding your personal information:
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">7.1 Access and Update</h3>
            <p>
              You can access and update your account information at any time through your account settings.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">7.2 Data Deletion</h3>
            <p>
              You can request deletion of your account and associated data by contacting us at
              support@finalcode.dev. Please note that some information may be retained in our backup systems
              for a limited time.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">7.3 Export Your Data</h3>
            <p>
              You can export your project files and code at any time through the editor interface.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">7.4 Marketing Communications</h3>
            <p>
              You can opt out of marketing emails by clicking the "unsubscribe" link in any marketing email
              or by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns</li>
              <li>Improve user experience</li>
            </ul>
            <p className="mt-4">
              Essential cookies are necessary for the Service to function. You can control non-essential
              cookies through your browser settings, but this may limit some features of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Children's Privacy</h2>
            <p>
              Our Service is not directed to individuals under the age of 13. We do not knowingly collect
              personal information from children under 13. If you become aware that a child has provided us
              with personal information, please contact us, and we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and maintained on servers located outside of your state,
              province, country, or other governmental jurisdiction where data protection laws may differ.
              By using the Service, you consent to such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. California Privacy Rights</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer
              Privacy Act (CCPA), including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to request deletion of personal information</li>
              <li>Right to non-discrimination for exercising your rights</li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">12. GDPR Compliance</h2>
            <p>
              If you are located in the European Economic Area (EEA), you have rights under the General
              Data Protection Regulation (GDPR), including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Right of access to your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at support@finalcode.dev.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are
              advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">14. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, please
              contact us at:
            </p>
            <p className="mt-2">
              Email: <a href="mailto:support@finalcode.dev" className="text-blue-400 hover:text-blue-300">support@finalcode.dev</a>
            </p>
            <p className="mt-2">
              For data protection inquiries: <a href="mailto:privacy@finalcode.dev" className="text-blue-400 hover:text-blue-300">privacy@finalcode.dev</a>
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-center">
              <a href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</a>
              {' · '}
              <a href="/terms" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
