-- FinalCode Complete Database Setup
-- Run this in your Supabase SQL Editor to set up all tables and functions

-- ============================================
-- PART 1: Core Functions and Tables
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 2: Deployments and Preview URLs
-- ============================================

CREATE TABLE IF NOT EXISTS public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  deployment_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'deploying', 'success', 'failed')),
  error_message TEXT,
  files JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.preview_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preview_id TEXT NOT NULL UNIQUE,
  preview_url TEXT NOT NULL,
  files JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON public.deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_subdomain ON public.deployments(subdomain);
CREATE INDEX IF NOT EXISTS idx_preview_urls_user_id ON public.preview_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_preview_urls_preview_id ON public.preview_urls(preview_id);
CREATE INDEX IF NOT EXISTS idx_preview_urls_expires_at ON public.preview_urls(expires_at);

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preview_urls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own deployments" ON public.deployments;
CREATE POLICY "Users can view their own deployments"
  ON public.deployments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own deployments" ON public.deployments;
CREATE POLICY "Users can insert their own deployments"
  ON public.deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own deployments" ON public.deployments;
CREATE POLICY "Users can update their own deployments"
  ON public.deployments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own deployments" ON public.deployments;
CREATE POLICY "Users can delete their own deployments"
  ON public.deployments FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own preview URLs" ON public.preview_urls;
CREATE POLICY "Users can view their own preview URLs"
  ON public.preview_urls FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view non-expired previews" ON public.preview_urls;
CREATE POLICY "Anyone can view non-expired previews"
  ON public.preview_urls FOR SELECT
  USING (expires_at > NOW());

DROP POLICY IF EXISTS "Users can insert their own preview URLs" ON public.preview_urls;
CREATE POLICY "Users can insert their own preview URLs"
  ON public.preview_urls FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own preview URLs" ON public.preview_urls;
CREATE POLICY "Users can delete their own preview URLs"
  ON public.preview_urls FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_deployments_updated_at ON public.deployments;
CREATE TRIGGER update_deployments_updated_at
  BEFORE UPDATE ON public.deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION cleanup_expired_previews()
RETURNS void AS $$
BEGIN
  DELETE FROM public.preview_urls WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 3: Subscriptions and Usage Tracking
-- ============================================

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

CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON public.ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON public.ai_request_logs(created_at);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert subscriptions" ON public.subscriptions;
CREATE POLICY "Service can insert subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_tracking;
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage usage tracking" ON public.usage_tracking;
CREATE POLICY "Service can manage usage tracking"
  ON public.usage_tracking FOR ALL
  USING (true);

DROP POLICY IF EXISTS "Users can view their own AI request logs" ON public.ai_request_logs;
CREATE POLICY "Users can view their own AI request logs"
  ON public.ai_request_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert AI request logs" ON public.ai_request_logs;
CREATE POLICY "Service can insert AI request logs"
  ON public.ai_request_logs FOR INSERT
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON public.usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION initialize_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.usage_tracking (user_id, period_start, period_end)
  VALUES (NEW.id, NOW(), NOW() + INTERVAL '1 day');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_subscription();

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

-- ============================================
-- PART 4: Projects (Normalized Schema)
-- ============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at);

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, path)
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON public.project_files(user_id);

DROP TRIGGER IF EXISTS update_project_files_updated_at ON public.project_files;
CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own project files" ON public.project_files;
CREATE POLICY "Users can view their own project files"
  ON public.project_files FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own project files" ON public.project_files;
CREATE POLICY "Users can insert their own project files"
  ON public.project_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own project files" ON public.project_files;
CREATE POLICY "Users can update their own project files"
  ON public.project_files FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own project files" ON public.project_files;
CREATE POLICY "Users can delete their own project files"
  ON public.project_files FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 5: Initialize existing users
-- ============================================

-- Create subscriptions for existing users who don't have one
INSERT INTO public.subscriptions (user_id, plan_type, status)
SELECT id, 'free', 'active' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.subscriptions)
ON CONFLICT DO NOTHING;

-- Create usage tracking for existing users who don't have one
INSERT INTO public.usage_tracking (user_id, period_start, period_end)
SELECT id, NOW(), NOW() + INTERVAL '1 day' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.usage_tracking)
ON CONFLICT DO NOTHING;
