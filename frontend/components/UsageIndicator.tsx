'use client';

import { useEffect, useState } from 'react';
import { Activity, Folder, Crown } from 'lucide-react';

interface Usage {
  planType: string;
  aiRequestsToday: number;
  aiRequestsLimit: number;
  projectsCount: number;
  projectsLimit: number;
  canCreatePrivate: boolean;
}

export default function UsageIndicator() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
    // Refresh usage every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) return null;

  const aiPercentage = (usage.aiRequestsToday / usage.aiRequestsLimit) * 100;
  const projectsPercentage = (usage.projectsCount / usage.projectsLimit) * 100;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
      {/* Plan Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown
            className={`w-5 h-5 ${
              usage.planType === 'free'
                ? 'text-gray-400'
                : usage.planType === 'pro'
                  ? 'text-blue-400'
                  : 'text-purple-400'
            }`}
          />
          <span className="text-sm font-medium text-white capitalize">
            {usage.planType} Plan
          </span>
        </div>
        {usage.planType === 'free' && (
          <a
            href="/pricing"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Upgrade
          </a>
        )}
      </div>

      {/* AI Requests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">AI Requests Today</span>
          </div>
          <span className="text-xs text-white">
            {usage.aiRequestsToday} / {usage.aiRequestsLimit}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor(aiPercentage)}`}
            style={{ width: `${Math.min(aiPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Projects</span>
          </div>
          <span className="text-xs text-white">
            {usage.projectsCount} /{' '}
            {usage.projectsLimit === 999999 ? '∞' : usage.projectsLimit}
          </span>
        </div>
        {usage.projectsLimit !== 999999 && (
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor(projectsPercentage)}`}
              style={{ width: `${Math.min(projectsPercentage, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
