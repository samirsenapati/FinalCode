export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

        <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
          <p className="text-sm text-gray-400">
            Last Updated: December 13, 2025
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using FinalCode ("the Service"), you accept and agree to be bound by the terms
              and provision of this agreement. If you do not agree to these Terms of Service, please do not
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Description of Service</h2>
            <p>
              FinalCode is an AI-powered web development platform that allows users to build, preview, and
              deploy web applications using natural language and code editing tools. The Service includes:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Code editor with syntax highlighting</li>
              <li>AI-powered code generation using Claude AI</li>
              <li>Live preview functionality</li>
              <li>Deployment to Cloudflare Pages</li>
              <li>Temporary preview sharing</li>
              <li>User authentication and account management</li>
              <li>Subscription billing and payment processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.1 Registration</h3>
            <p>
              To use certain features of the Service, you must register for an account. You agree to provide
              accurate, current, and complete information during registration and to update such information
              to keep it accurate, current, and complete.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">3.2 Account Security</h3>
            <p>
              You are responsible for safeguarding your password and for all activities that occur under your
              account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Subscription and Billing</h2>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.1 Subscription Plans</h3>
            <p>
              FinalCode offers different subscription plans with varying features and usage limits. Details
              of each plan are available on our pricing page.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.2 Payment</h3>
            <p>
              Subscription fees are charged on a recurring basis. By subscribing to a paid plan, you authorize
              us to charge your payment method for the applicable fees. All payments are processed securely
              through Stripe.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.3 Cancellation and Refunds</h3>
            <p>
              You may cancel your subscription at any time through your account settings or by contacting
              support. We offer a 14-day money-back guarantee for first-time subscribers. Refunds are
              processed within 5-10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Usage Limits and Fair Use</h2>
            <p>
              Each subscription plan includes specific usage limits for AI requests, projects, and deployments.
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Exceed your plan's usage limits through automated means</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to circumvent usage tracking or billing systems</li>
              <li>Use the Service to generate malicious code or malware</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Intellectual Property</h2>
            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.1 Your Content</h3>
            <p>
              You retain all rights to the code and content you create using FinalCode. By using the Service,
              you grant us a limited license to host, store, and process your content solely for the purpose
              of providing the Service.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.2 Our Service</h3>
            <p>
              FinalCode and its original content, features, and functionality are owned by FinalCode and are
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. AI-Generated Content</h2>
            <p>
              FinalCode uses AI technology (Claude by Anthropic) to generate code. While we strive for
              accuracy:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>AI-generated code may contain errors or bugs</li>
              <li>You are responsible for reviewing and testing all generated code</li>
              <li>We do not guarantee the functionality or security of AI-generated code</li>
              <li>You should not deploy AI-generated code to production without proper testing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Deployments and Third-Party Services</h2>
            <p>
              Deployments are handled through Cloudflare Pages, a third-party service. By using our deployment
              features, you also agree to comply with Cloudflare's terms of service. We are not responsible
              for the availability or performance of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect,
              use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE,
              OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL FINALCODE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER
              INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">12. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior
              notice or liability, for any reason, including breach of these Terms. Upon termination, your
              right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material
              changes via email or through the Service. Your continued use of the Service after such changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">15. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              Email: <a href="mailto:support@finalcode.dev" className="text-blue-400 hover:text-blue-300">support@finalcode.dev</a>
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-700">
            <p className="text-center">
              <a href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</a>
              {' · '}
              <a href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
