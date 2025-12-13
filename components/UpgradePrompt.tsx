'use client';

import { useState } from 'react';
import { X, Zap, Crown } from 'lucide-react';

interface UpgradePromptProps {
  type: 'ai-limit' | 'project-limit' | 'private-project';
  onClose: () => void;
}

export default function UpgradePrompt({ type, onClose }: UpgradePromptProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    window.location.href = '/pricing';
  };

  const messages = {
    'ai-limit': {
      title: 'AI Request Limit Reached',
      description:
        'You\'ve reached your daily AI request limit. Upgrade to Pro for 500 requests per day!',
      icon: Zap,
    },
    'project-limit': {
      title: 'Project Limit Reached',
      description:
        'You\'ve reached your project limit. Upgrade to Pro for unlimited projects!',
      icon: Crown,
    },
    'private-project': {
      title: 'Private Projects Unavailable',
      description:
        'Private projects are only available on Pro and Team plans. Upgrade to keep your code private!',
      icon: Crown,
    },
  };

  const message = messages[type];
  const Icon = message.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full p-8 relative border border-gray-700 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            {message.title}
          </h2>

          <p className="text-gray-400 mb-8">{message.description}</p>

          <div className="w-full space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? 'Loading...' : 'View Pricing Plans'}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Pro plans start at just $15/month
          </p>
        </div>
      </div>
    </div>
  );
}
