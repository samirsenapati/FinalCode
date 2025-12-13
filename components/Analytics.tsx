'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

export function Analytics() {
  // Only load analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return <VercelAnalytics />;
}
