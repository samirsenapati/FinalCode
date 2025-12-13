# Phase 5: Monetization & Polish

This document outlines the implementation of Phase 5, which includes Stripe payment integration and UX polish features.

## Overview

Phase 5 adds monetization capabilities and improves the overall user experience with:
- Three-tier subscription model (Free, Pro, Team)
- Stripe payment integration
- Usage tracking and limits
- Onboarding flow for new users
- Template projects
- Keyboard shortcuts
- Enhanced error handling
- Loading states and animations
- Mobile-responsive design

## Pricing Tiers

### Free Plan ($0/month)
- 3 projects
- 50 AI requests per day
- Public projects only
- Community support

### Pro Plan ($15/month)
- Unlimited projects
- 500 AI requests per day
- Private projects
- Priority support
- Advanced analytics

### Team Plan ($30/user/month)
- Everything in Pro
- Team collaboration
- Shared workspaces
- Advanced permissions
- Usage analytics

## Database Schema

### New Tables

#### `subscriptions`
Tracks user subscription information:
- `user_id` - References auth.users
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `stripe_price_id` - Stripe price ID
- `plan_type` - 'free', 'pro', or 'team'
- `status` - Subscription status
- `current_period_start/end` - Billing period

#### `usage_tracking`
Monitors usage limits:
- `user_id` - References auth.users
- `ai_requests_count` - Daily AI request count
- `projects_count` - Total projects count
- `period_start/end` - Tracking period

#### `ai_request_logs`
Detailed AI request logging:
- `user_id` - References auth.users
- `request_type` - Type of AI request
- `tokens_used` - Tokens consumed

#### `projects`
User projects storage:
- `user_id` - References auth.users
- `name` - Project name
- `is_public` - Public/private flag
- `files` - JSONB of project files

## Stripe Integration

### Setup

1. **Environment Variables** (`.env.local`):
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...
```

2. **Create Stripe Products**:
   - Go to https://dashboard.stripe.com/products
   - Create "Pro" and "Team" products with recurring monthly pricing
   - Copy the price IDs to your .env.local

3. **Setup Webhook**:
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the webhook signing secret

### API Routes

#### `/api/stripe/checkout`
Creates a Stripe checkout session for subscription signup.

**Request:**
```json
{
  "priceId": "price_...",
  "planType": "pro"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

#### `/api/stripe/portal`
Creates a Stripe customer portal session for managing subscriptions.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

#### `/api/stripe/webhook`
Handles Stripe webhook events for subscription updates.

### Usage Tracking

The system automatically tracks:
- **AI Requests**: Incremented on each AI chat request
- **Projects**: Incremented when creating projects
- **Daily Reset**: Usage resets every 24 hours

#### Check Usage Limits

```typescript
import { canMakeAIRequest, canCreateProject } from '@/lib/usage/tracking';

// Before AI request
const allowed = await canMakeAIRequest(userId);
if (!allowed) {
  // Show upgrade prompt
}

// Before creating project
const allowed = await canCreateProject(userId);
if (!allowed) {
  // Show upgrade prompt
}
```

#### Track AI Request

```typescript
import { trackAIRequest } from '@/lib/usage/tracking';

await trackAIRequest(userId, 'chat', tokensUsed);
```

## Components

### Upgrade Prompts

Show upgrade prompts when users hit limits:

```typescript
import UpgradePrompt from '@/components/UpgradePrompt';

<UpgradePrompt
  type="ai-limit"
  onClose={() => setShowPrompt(false)}
/>
```

Types:
- `ai-limit` - AI request limit reached
- `project-limit` - Project count limit reached
- `private-project` - Trying to create private project on free plan

### Usage Indicator

Display current usage in the UI:

```typescript
import UsageIndicator from '@/components/UsageIndicator';

<UsageIndicator />
```

### Onboarding Tour

Show onboarding tour for new users:

```typescript
import OnboardingTour from '@/components/onboarding/OnboardingTour';

<OnboardingTour />
```

The tour automatically shows on first visit and can be dismissed.

### Template Gallery

Allow users to start with pre-built templates:

```typescript
import TemplateGallery from '@/components/templates/TemplateGallery';

<TemplateGallery
  onSelect={(files) => {
    // Load template files
  }}
  onClose={() => setShowGallery(false)}
/>
```

Available templates:
- **Todo App**: Simple todo list application
- **Blog**: Clean blog layout
- **Portfolio**: Professional portfolio site

### Keyboard Shortcuts

Use the keyboard shortcuts hook:

```typescript
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';

useKeyboardShortcuts([
  {
    ...KEYBOARD_SHORTCUTS.SAVE,
    action: () => saveFile(),
  },
  {
    ...KEYBOARD_SHORTCUTS.RUN,
    action: () => runPreview(),
  },
  {
    ...KEYBOARD_SHORTCUTS.DEPLOY,
    action: () => deploy(),
  },
]);
```

Show keyboard shortcuts help:

```typescript
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';

<KeyboardShortcutsHelp />
```

Press `Ctrl+/` to toggle the shortcuts panel.

### Error Handling

Wrap your app in the error boundary:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Show inline error messages:

```typescript
import { ErrorMessage } from '@/components/ErrorBoundary';

<ErrorMessage
  message="Failed to load data"
  onRetry={() => fetchData()}
/>
```

### Loading States

Use loading components:

```typescript
import { LoadingState, LoadingSpinner, SkeletonLoader } from '@/components/LoadingState';

// Full screen loading
<LoadingState message="Loading..." fullScreen />

// Inline spinner
<LoadingSpinner size="md" />

// Skeleton loader
<SkeletonLoader />
```

### Toast Notifications

Show toast notifications:

```typescript
import { useToast } from '@/components/Toast';

const { showToast, ToastComponent } = useToast();

showToast('success', 'Project deployed successfully!');

return (
  <>
    {ToastComponent}
    {/* Your app */}
  </>
);
```

## Mobile Responsiveness

The application is fully responsive with:

- **Mobile-first design**: Optimized for small screens
- **Touch-friendly targets**: Minimum 44px tap targets
- **Responsive typography**: Scales based on screen size
- **Flexible layouts**: Adapts to different screen sizes
- **Safe area insets**: Handles device notches
- **Responsive panels**: Stacks vertically on mobile

### Media Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Accessibility Features

- **Keyboard navigation**: Full keyboard support
- **Focus indicators**: Clear focus states
- **Screen reader support**: Semantic HTML and ARIA labels
- **High contrast mode**: Supports OS high contrast settings
- **Reduced motion**: Respects user motion preferences
- **Color contrast**: WCAG AA compliant

## Database Functions

### `get_user_usage(p_user_id UUID)`

Returns current usage and limits for a user:

```sql
SELECT * FROM get_user_usage('user-id');
```

Returns:
- `plan_type` - Current plan
- `ai_requests_today` - AI requests used today
- `ai_requests_limit` - Daily AI request limit
- `projects_count` - Total projects
- `projects_limit` - Project limit
- `can_create_private` - Can create private projects

### `reset_daily_usage()`

Resets daily usage counters (run via cron):

```sql
SELECT reset_daily_usage();
```

### `initialize_user_subscription()`

Automatically creates free subscription for new users (trigger).

## Testing

### Test Stripe Integration

1. Use Stripe test mode with test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. Test webhook locally with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Trigger test events:
```bash
stripe trigger customer.subscription.created
```

### Test Usage Limits

1. Create test users with different plans
2. Make AI requests until limit is reached
3. Verify upgrade prompts appear
4. Test project creation limits

## Deployment Checklist

- [ ] Set production Stripe keys
- [ ] Configure Stripe webhook URL
- [ ] Run database migrations
- [ ] Test subscription flows
- [ ] Verify webhook handling
- [ ] Test all pricing tiers
- [ ] Check usage tracking
- [ ] Test mobile responsiveness
- [ ] Verify accessibility features
- [ ] Monitor error logging

## Future Enhancements

Potential improvements for future phases:
- Annual billing discounts
- Enterprise plan
- Team collaboration features
- Advanced analytics dashboard
- Custom branding
- API access
- Referral program
- Credit system for overages

## Support

For issues or questions:
- Check Stripe Dashboard logs
- Review Supabase logs
- Check browser console for errors
- Verify environment variables
- Test webhooks with Stripe CLI

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
