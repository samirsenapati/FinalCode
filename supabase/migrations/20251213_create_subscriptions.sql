-- Create subscriptions table to track user subscription plans
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'team')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')) DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create usage_tracking table to monitor AI requests and project limits
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_requests_count INTEGER DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_request_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create legacy projects table (older schema, kept for backward compatibility)
-- NOTE: FinalCode production uses a normalized schema created in 20251214_projects_normalized.sql:
--   - public.projects
--   - public.project_files
-- This legacy table is renamed to avoid conflicts.
CREATE TABLE IF NOT EXISTS public.projects_legacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  files JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON public.ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON public.ai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_legacy_user_id ON public.projects_legacy(user_id);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects_legacy ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions table
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Policies for usage_tracking table
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage usage tracking"
  ON public.usage_tracking
  FOR ALL
  USING (true);

-- Policies for ai_request_logs table
CREATE POLICY "Users can view their own AI request logs"
  ON public.ai_request_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert AI request logs"
  ON public.ai_request_logs
  FOR INSERT
  WITH CHECK (true);

-- Policies for legacy projects table
CREATE POLICY "Users can view their own legacy projects"
  ON public.projects_legacy
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public legacy projects"
  ON public.projects_legacy
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own legacy projects"
  ON public.projects_legacy
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legacy projects"
  ON public.projects_legacy
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own legacy projects"
  ON public.projects_legacy
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on usage_tracking
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on legacy projects
CREATE TRIGGER update_projects_legacy_updated_at
  BEFORE UPDATE ON public.projects_legacy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user subscription on signup
CREATE OR REPLACE FUNCTION initialize_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Create free subscription for new user
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');

  -- Initialize usage tracking for current period
  INSERT INTO public.usage_tracking (user_id, period_start, period_end)
  VALUES (
    NEW.id,
    NOW(),
    NOW() + INTERVAL '1 day'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize subscription when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_subscription();

-- Function to reset daily usage
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.usage_tracking
  SET
    ai_requests_count = 0,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '1 day',
    updated_at = NOW()
  WHERE period_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get current usage for a user
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID)
RETURNS TABLE (
  plan_type TEXT,
  ai_requests_today INTEGER,
  ai_requests_limit INTEGER,
  projects_count INTEGER,
  projects_limit INTEGER,
  can_create_private BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.plan_type,
    COALESCE(ut.ai_requests_count, 0) as ai_requests_today,
    CASE s.plan_type
      WHEN 'free' THEN 50
      WHEN 'pro' THEN 500
      WHEN 'team' THEN 500
    END as ai_requests_limit,
    COALESCE(ut.projects_count, 0) as projects_count,
    CASE s.plan_type
      WHEN 'free' THEN 3
      WHEN 'pro' THEN 999999
      WHEN 'team' THEN 999999
    END as projects_limit,
    s.plan_type != 'free' as can_create_private
  FROM public.subscriptions s
  LEFT JOIN public.usage_tracking ut ON s.user_id = ut.user_id
  WHERE s.user_id = p_user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
