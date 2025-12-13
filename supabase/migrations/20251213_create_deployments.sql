-- Create deployments table to track all deployments
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

-- Create preview_urls table for temporary preview links
CREATE TABLE IF NOT EXISTS public.preview_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preview_id TEXT NOT NULL UNIQUE,
  preview_url TEXT NOT NULL,
  files JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON public.deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_subdomain ON public.deployments(subdomain);
CREATE INDEX IF NOT EXISTS idx_preview_urls_user_id ON public.preview_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_preview_urls_preview_id ON public.preview_urls(preview_id);
CREATE INDEX IF NOT EXISTS idx_preview_urls_expires_at ON public.preview_urls(expires_at);

-- Enable Row Level Security
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preview_urls ENABLE ROW LEVEL SECURITY;

-- Policies for deployments table
CREATE POLICY "Users can view their own deployments"
  ON public.deployments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployments"
  ON public.deployments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments"
  ON public.deployments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deployments"
  ON public.deployments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for preview_urls table
CREATE POLICY "Users can view their own preview URLs"
  ON public.preview_urls
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view non-expired previews"
  ON public.preview_urls
  FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Users can insert their own preview URLs"
  ON public.preview_urls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preview URLs"
  ON public.preview_urls
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on deployments
CREATE TRIGGER update_deployments_updated_at
  BEFORE UPDATE ON public.deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired preview URLs (run this periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_previews()
RETURNS void AS $$
BEGIN
  DELETE FROM public.preview_urls WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
