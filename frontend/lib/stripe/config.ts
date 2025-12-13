import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Keep in sync with installed stripe types
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

// Pricing configuration
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '3 projects',
      '50 AI requests per day',
      'Public projects only',
      'Community support',
    ],
    limits: {
      projects: 3,
      aiRequestsPerDay: 50,
      canCreatePrivate: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 15,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Unlimited projects',
      '500 AI requests per day',
      'Private projects',
      'Priority support',
      'Advanced analytics',
    ],
    limits: {
      projects: 999999,
      aiRequestsPerDay: 500,
      canCreatePrivate: true,
    },
  },
  team: {
    name: 'Team',
    price: 30,
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Shared workspaces',
      'Priority support',
      'Advanced permissions',
      'Usage analytics',
    ],
    limits: {
      projects: 999999,
      aiRequestsPerDay: 500,
      canCreatePrivate: true,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

export function getPlanLimits(planType: PlanType) {
  return PLANS[planType]?.limits || PLANS.free.limits;
}
