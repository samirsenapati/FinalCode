'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { PLANS } from '@/lib/stripe/config';
import { getStripe } from '@/lib/stripe/client';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string | null, planType: string) => {
    if (!priceId) return; // Free plan

    setLoading(planType);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planType }),
      });

      const { url, error } = await response.json();

      if (error) {
        alert('Failed to start checkout: ' + error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Start building amazing projects with AI-powered coding
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {PLANS.free.name}
              </h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">
                  ${PLANS.free.price}
                </span>
                <span className="text-gray-400 ml-2">/month</span>
              </div>
              <button
                className="w-full py-3 px-6 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
                onClick={() => (window.location.href = '/login')}
              >
                Get Started
              </button>
            </div>
            <ul className="space-y-4">
              {PLANS.free.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 border-2 border-blue-500 shadow-2xl transform scale-105 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </span>
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {PLANS.pro.name}
              </h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">
                  ${PLANS.pro.price}
                </span>
                <span className="text-blue-100 ml-2">/month</span>
              </div>
              <button
                className="w-full py-3 px-6 rounded-lg bg-white text-blue-600 font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleSubscribe(PLANS.pro.priceId!, 'pro')}
                disabled={loading === 'pro'}
              >
                {loading === 'pro' ? 'Loading...' : 'Subscribe Now'}
              </button>
            </div>
            <ul className="space-y-4">
              {PLANS.pro.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <Check className="w-5 h-5 text-white mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-white">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Team Plan */}
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {PLANS.team.name}
              </h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">
                  ${PLANS.team.price}
                </span>
                <span className="text-gray-400 ml-2">/user/month</span>
              </div>
              <button
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleSubscribe(PLANS.team.priceId!, 'team')}
                disabled={loading === 'team'}
              >
                {loading === 'team' ? 'Loading...' : 'Subscribe Now'}
              </button>
            </div>
            <ul className="space-y-4">
              {PLANS.team.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <Check className="w-5 h-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                will be prorated automatically.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-2">
                What happens when I reach my AI request limit?
              </h3>
              <p className="text-gray-400">
                You'll see a prompt to upgrade your plan. Free plan resets daily,
                while Pro and Team plans have higher daily limits.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-400">
                We offer a 14-day money-back guarantee. If you're not satisfied,
                contact us for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Home
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-8 border-t border-gray-700 text-sm text-gray-500 space-x-4">
          <a href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="/contact" className="hover:text-blue-400 transition-colors">Contact & Support</a>
        </div>
      </div>
    </div>
  );
}
