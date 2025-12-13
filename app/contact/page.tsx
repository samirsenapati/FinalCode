'use client';

import { useState } from 'react';
import { Mail, Send, MessageCircle, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create mailto link with form data
    const mailtoLink = `mailto:support@finalcode.dev?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;

    window.location.href = mailtoLink;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Contact & Support</h1>
          <p className="text-xl text-gray-400">
            We're here to help! Reach out to us with any questions or concerns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-6">Get in Touch</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email Support</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    For general inquiries and support
                  </p>
                  <a
                    href="mailto:support@finalcode.dev"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    support@finalcode.dev
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Technical Support</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    For bugs, issues, and technical questions
                  </p>
                  <a
                    href="mailto:tech@finalcode.dev"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    tech@finalcode.dev
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-600 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Privacy & Data</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    For privacy concerns and data requests
                  </p>
                  <a
                    href="mailto:privacy@finalcode.dev"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    privacy@finalcode.dev
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <h3 className="font-semibold text-white mb-4">Response Time</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• General inquiries: Within 24 hours</li>
                <li>• Technical support: Within 12 hours</li>
                <li>• Critical issues: Within 4 hours</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-6">Send a Message</h2>

            {submitted ? (
              <div className="bg-green-600/10 border border-green-600 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-400">
                  Your default email client should open with your message. If not, please email us directly at support@finalcode.dev
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing Question">Billing Question</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Privacy/Data Request">Privacy/Data Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>

                <p className="text-xs text-gray-400 text-center">
                  This will open your default email client. You can also email us directly at the addresses above.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-gray-800 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                How do I reset my password?
              </h3>
              <p className="text-gray-400">
                Click the "Forgot Password" link on the login page, and we'll send you a reset link via email.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time from your account settings. We offer a 14-day money-back guarantee.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                How do I delete my account?
              </h3>
              <p className="text-gray-400">
                Please contact us at support@finalcode.dev to request account deletion. We'll process your request within 48 hours.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Where is my data stored?
              </h3>
              <p className="text-gray-400">
                Your data is securely stored using Supabase with encryption. See our <a href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a> for details.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
