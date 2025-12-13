'use client';

import { Loader2, Code2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
            <Code2 className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-white text-lg font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />;
}

export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-700 rounded w-5/6" />
    </div>
  );
}

export function DeploymentProgress({ status }: { status: string }) {
  const stages = ['pending', 'building', 'deploying', 'success'];
  const currentIndex = stages.indexOf(status);

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isFailed = status === 'failed' && isActive;

        return (
          <div key={stage} className="flex items-center gap-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isFailed
                  ? 'bg-red-500 border-red-500'
                  : isCompleted
                    ? 'bg-green-500 border-green-500'
                    : isActive
                      ? 'bg-blue-500 border-blue-500 animate-pulse'
                      : 'bg-gray-700 border-gray-600'
              }`}
            >
              {isActive && !isFailed && <Loader2 className="w-4 h-4 text-white animate-spin" />}
              {isCompleted && <span className="text-white text-lg">✓</span>}
              {isFailed && <span className="text-white text-lg">✕</span>}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  isFailed
                    ? 'text-red-400'
                    : isCompleted || isActive
                      ? 'text-white'
                      : 'text-gray-500'
                }`}
              >
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
